const express = require("express")
const route = express.Router()
const utils = require('../lib/utils')
const { readFile, writeFile } = require('../lib/myFs')

// 传参必须传入column的ID
route.use(async (req, res, next) => {
  try {
    const postList = await readFile(`./database/post.txt`, 'utf8')
    req.$POSTLIST = postList ? JSON.parse(postList) : []
  } catch (e) {
    req.$POSTLIST = []
    console.log('readPost', e)
  }
  try {
    const columnList = await readFile('./database/column.txt', 'utf8')
    req.$COLUMNLIST = columnList ? JSON.parse(columnList) : []
  } catch (e) {
    req.$COLUMNLIST = []
    console.log('readColumn', e)
  }
  next()
})

route.post('/createPost', async (req, res) => {
  try {
    console.log(req.user)
    if (!req.user) {
      utils.responseInfo(res, {
        code: 1,
        codeText: "请先登录！"
      })
      return
    } else {
      const column_id = req.body && req.body.column_id || ''
      let hasColumn = req.$COLUMNLIST.find(column => +column.column_id === +column_id && +column.user_id === +req.user.user_id)
      if (!hasColumn) {
        utils.responseInfo(res, {
          code: 1,
          codeText: "你尚未新建专栏！请先新建专栏！"
        })
        return
      } else {
        const {
          title,
          content,
          image,
          column_id
        } = req.body
        let _id = utils.createID(req.$POSTLIST)

        const postInfo = {
          _id,
          post_id: _id,
          title,
          content,
          image,
          column_id,
          user_id: req.user.user_id,
          createAt: new Date().toLocaleString('zh-CN', {hour12: false})
        }
        req.$POSTLIST.push(postInfo)

        writeFile(`./database/post.txt`, req.$POSTLIST, 'utf8').then((result, err)=> {
          if (err) {
            utils.responseInfo(res, {
              code: 1,
              codeText: "新建失败！"
            })
            return
          }
          utils.responseInfo(res)
        })
      }
    }
  } catch (e) {
    utils.responseInfo(res, {
      code: 1,
      codeText: "您不能新建文章！"
    })
  }
})

route.get('/postInfo/:pid', (req, res) => {
  console.log(req.params.pid)
  const post_id = req.params.pid
  const postInfo = req.$POSTLIST.find(post => parseInt(post.post_id) === parseInt(post_id))
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

/**
 * patch与post区别
 * patch 传入部分数据，就值更新传入的数据，但是返回时，会全部返回
 * post 如果只传入部分数据时，只会返回参数中只有传入的那些数据
 *
 * */
route.patch('/postUpdate/:pid', async (req, res) => {
  const pid = req.params.pid
  const updateData = req.body
  console.log(req.body)
  let postInfo = req.$POSTLIST.find(post => parseInt(post.post_id) === parseInt(pid))
  if (!postInfo) {
    utils.responseInfo(res, {
      code: 1,
      codeText: "未找到文章！"
    })
    return
  }
  if (updateData) {
    Object.assign(postInfo, updateData)
    await writeFile(`./database/post.txt`, req.$POSTLIST, 'utf8')
    utils.responseInfo(res, {
      data: req.$POSTLIST
    })
  } else {
    utils.responseInfo(res, {
      code: 1,
      codeText: '数据出错'
    })
  }
})

route.post('/postDelete', async (req, res) => {
  const {
    post_id,
    column_id
  } = req.body

  let delete_index = req.$POSTLIST.findIndex(post => {
    return parseInt(post.post_id) === parseInt(post_id)
  })
  let post_delete = req.$POSTLIST.find(post => {
    return parseInt(post.post_id) === parseInt(post_id)
  })

  if ((delete_index === -1) && !post_delete) {
    utils.responseInfo(res, {
      code: 1,
      codeText: "删除失败"
    })
    return
  }

  req.$POSTLIST.splice(delete_index, 1)
  await writeFile(`./database/post.txt`, req.$POSTLIST, 'utf8')

  utils.responseInfo(res, {
    data: post_delete
  })
})

route.post('/postList', async (req, res) => {
  const {
    column_id,
    currentPage = 1,
    limit = 10
  } = req.body
  let list = req.$POSTLIST.filter(post => +post.column_id === +column_id)
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
