const express = require("express")
const route = express.Router()
const utils = require('../lib/utils')
const { readFile, writeFile } = require('../lib/myFs')

// 传参必须传入column的ID
route.use(async (req, res, next) => {
  if (!req.session.userID) {
    req.session.userID =  req.signedCookies.uid
  }
  try {

    let columnIndex = await readFile('./database/columnIndex.txt', 'utf8')
    if (!columnIndex) {
      columnIndex = []
    } else {
      columnIndex = JSON.parse(columnIndex)
    }
    req.$COLUMNINDEX = columnIndex
    let postIndex= await readFile('./database/postIndex.txt', 'utf8')
    if (!postIndex) {
      postIndex = []
    } else {
      postIndex = JSON.parse(postIndex)
    }
    req.$POSTINDEX = postIndex

    let users= await readFile('./database/users.txt', 'utf8')
    if (!users) {
      users = []
    } else {
      users = JSON.parse(users)
    }
    req.$USERS = users


    let hasColumn = req.$COLUMNINDEX.find(column => +column.user_id === +req.session.userID)
    if (hasColumn) {
      let info = await readFile(`./database/columns/${hasColumn.path}.txt`, 'utf8')
      req.$COlUMNINFO = JSON.parse(info)
    }
    let hasPostIndex = req.$POSTINDEX.find(index => parseInt(index.user_id) === parseInt(req.session.userID) && parseInt(index.column_id) === parseInt(req.body.column))
    if (hasPostIndex) {
      let post_list = await readFile(`./database/post/${hasPostIndex.path}.txt`, 'utf8')
      if (!post_list) {
        req.$POSTLIST = []
      } else {
        req.$POSTLIST = JSON.parse(post_list)
      }
    } else {
      req.$POSTLIST = []
    }
    next()

  } catch (e) {
    console.log(e)
  }

})

route.post('/createPost', async (req, res) => {
  console.log(req.signedCookies)
  // 判断是否登录
  if (!req.session.userID && !req.signedCookies.uid) {
    utils.responseInfo(res, {
      code: 1,
      codeText: "请先登录！"
    })
    return
  }
  // 判断是否有专栏列表
  // let hasColumn = req.$COLUMNINDEX.find(column => +column.user_id === +req.session.userID)
  if (!req.$COlUMNINFO) {
    utils.responseInfo(res, {
      code: 1,
      codeText: "你尚未新建专栏！请先新建专栏！"
    })
    return
  }

  const {
    title,
    content,
    image,
    column,
    author
  } = req.body

  let post_index = {
    user_id: req.session.userID,
    column_id: column,
    path: `post${req.session.userID}-${column}`
  }
  if (!req.$POSTINDEX.find(index => parseInt(index.user_id) === parseInt(req.session.userID) && parseInt(index.column_id) === parseInt(column))) {
    req.$POSTINDEX.push(post_index)
  }
  let userInfo = req.$USERS.find(user => parseInt(user._id) === parseInt(author))
  let column_info = req.$COlUMNINFO.find(info => +info._id === +column)
  let post_info = {
    _id: utils.createID(req.$POSTLIST),
    title,
    content,
    image,
    column: column_info || {},
    author: userInfo || {},
    createAt: new Date().toLocaleString('zh-CN', {hour12: false})
  }

  req.$POSTLIST.push(post_info)
  await writeFile('./database/postIndex.txt', req.$POSTINDEX, 'utf8')
  await writeFile(`./database/post/post${req.session.userID}-${column}.txt`, req.$POSTLIST, 'utf8')

  utils.responseInfo(res)


})

route.post('/postInfo', (req, res) => {
  const {
    post_id
  } = req.body
  const postInfo = req.$POSTLIST.find(post => parseInt(post._id) === parseInt(post_id))
  if (!postInfo) {
    utils.responseInfo(res, {
      code: 1,
      codeText: "未找到文章！"
    })
    return
  }

  utils.responseInfo(res, {
    data: postInfo
  })
})

route.post('/postUpdate', async (req, res) => {
  const {
    column,
    post_id,
    title,
    content,
    image
  } = req.body
  let postInfo = req.$POSTLIST.find(post => parseInt(post._id) === parseInt(post_id))
  if (!postInfo) {
    utils.responseInfo(res, {
      code: 1,
      codeText: "未找到文章！"
    })
    return
  }

  Object.assign(postInfo, {title, content, image})
  await writeFile(`./database/post/post${req.session.userID}-${column}.txt`, req.$POSTLIST, 'utf8')

  utils.responseInfo(res)

})

route.post('/postDelete', async (req, res) => {
  const {
    post_id,
    column
  } = req.body

  let delete_index = req.$POSTLIST.findIndex(post => {
    return parseInt(post._id) === parseInt(post_id)
  })

  if (!delete_index) {
    utils.responseInfo(res, {
      code: 1,
      codeText: "删除失败"
    })
    return
  }

  req.$POSTLIST.splice(delete_index, 1)
  await writeFile(`./database/post/post${req.session.userID}-${column}.txt`, req.$POSTLIST, 'utf8')

  utils.responseInfo(res, {
    codeText: "删除成功"
  })
})

route.post('/postList', async (req, res) => {
  const {
    column,
    currentPage = 1,
    limit = 10
  } = req.body
  let list = req.$POSTLIST.slice((currentPage - 1) * limit, currentPage * limit)
  if (!list) {
    utils.responseInfo(res, {
      code: 1,
      codeText: "失败"
    })
    return
  }

  utils.responseInfo(res, {
    data: list
  })

})




module.exports = route
