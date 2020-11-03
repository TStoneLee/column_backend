const express = require("express")
const route = express.Router()

const { readFile, writeFile } = require("../lib/myFs")
const utils = require('../lib/utils')

route.use(async (req, res, next) => {
  // console.log(req.user)

  // if (!req.session.userID) {
  //   req.session.userID = req.signedCookies.uid
  // }
  try {
    req.$COLUMNINDEX = await readFile('./database/columnIndex.txt', 'utf8')
    req.$USERS = await readFile('./database/users.txt', 'utf8')
    req.$USERS = JSON.parse(req.$USERS)
    if (!req.$COLUMNINDEX) {
      req.$COLUMNINDEX = []
      req.$COLUMNLIST = []
    } else {
      req.$COLUMNINDEX = JSON.parse(req.$COLUMNINDEX)
      if (req.user) {
        const {
          _id,
          email
        } = req.user
        req.session.userID = _id

        let index = req.$COLUMNINDEX.find(i => parseInt(i.user_id) === parseInt(req.session.userID))
        if (index) {
          req.$COLUMNLIST = await readFile(`./database/columns/${index.path}.txt`, 'utf8')
          if (!req.$COLUMNLIST) {
            req.$COLUMNLIST = []
          } else {
            req.$COLUMNLIST = JSON.parse(req.$COLUMNLIST)
          }
        } else {
          req.$COLUMNLIST = []
        }
      } else {
        let allColumnList = []
        for (let column of req.$COLUMNINDEX) {
          let result = await readFile(`./database/columns/${column.path}.txt`, 'utf8')
          if (result) {
            allColumnList = allColumnList.concat(JSON.parse(result))
          }
        }
        req.$ALLCOLUMNLIST = allColumnList
      }
    }
  } catch(e) {
    console.log(e)
  }
  next()
})

route.get('/columnList', (req, res) => {
  let {
    currentPage = 1,
    limit = 10
  } = req.query
  currentPage = +currentPage
  limit = +limit
  const columnData = JSON.parse(JSON.stringify(req.$ALLCOLUMNLIST))
  let result = []
  // if (currentPage <= parseInt(columnData.length / limit)) {
    result = columnData.slice((currentPage -1) * limit, limit * currentPage)
  // }
  utils.responseInfo(res, {
    data: result
  })
})

route.get('/columnInfo/:cid', async (req, res) => {
  const cid = req.params.cid
  const info = req.$COLUMNLIST.find(column => column._id === parseInt(cid))
  if (!info) {
    utils.responseInfo(res, {
      code: 1,
      codeText: "查询该专栏失败！"
    })
    return
  }
  utils.responseInfo(res, {
    data: info
  })
})

route.post('/createColumn', async (req, res) => {
  const {
    title,
    description,
    avatar
  } = req.body
  let user = null
  if (req.session.userID) {
    user = req.$USERS.find(item => {
      return item._id === req.session.userID
    })
  }
  if (!user) {
    utils.responseInfo(res, {
      codeText: "你不能创建专栏，请检查！"
    })
    return
  }
  const columnInfo = {
    _id: utils.createID(req.$COLUMNLIST),
    title,
    description,
    avatar,
    author: user.nickName || user.email,
    createAt: new Date().toLocaleString('zh-CN', {hour12: false})
  }
  req.$COLUMNLIST.push(columnInfo)
  const column_index = {
    user_id: req.session.userID,
    path: `columns${req.session.userID}`
  }
  if (!req.$COLUMNINDEX.find(index => index.user_id === req.session.userID)) {
    req.$COLUMNINDEX.push(column_index)
  }
  await writeFile( `./database/columns/columns${req.session.userID}.txt`,req.$COLUMNLIST, 'utf8')
  await writeFile( `./database/columnIndex.txt`,req.$COLUMNINDEX, 'utf8')

  utils.responseInfo(res)
})

route.post('/columnUpdate/:cid', async (req, res) => {
  const cid = req.params.cid
  const updateInfo = req.body
  let info = req.$COLUMNLIST.find(column => column._id === parseInt(cid))
  if (!info) {
    utils.responseInfo(res, {
      code: 1,
      codeText: "更新该专栏失败！"
    })
    return
  }
  info = Object.assign(info, updateInfo)
  await writeFile( `./database/columns/columns${req.session.userID}.txt`,req.$COLUMNLIST, 'utf8')
  utils.responseInfo(res)
})

module.exports = route
