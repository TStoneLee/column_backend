const express = require("express")
const route = express.Router()

const { readFile, writeFile } = require("../lib/myFs")
const utils = require('../lib/utils')

route.use(async (req, res, next) => {
  // if (req.user) {
  //   const {
  //     user_id,
  //     email
  //   } = req.user
  // }
  try {
    const columnList = await readFile('./database/column.txt', 'utf8')
    req.$COLUMNLIST = columnList ? JSON.parse(columnList) : []
  } catch (e) {
    req.$COLUMNLIST = []
    console.log('readColumn', e)
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
  const columnData = JSON.parse(JSON.stringify(req.$COLUMNLIST))
  let result = []
  // if (currentPage <= parseInt(columnData.length / limit)) {
    result = columnData.slice((currentPage -1) * limit, limit * currentPage)
  // }
  utils.responseInfo(res, {
    data: result
  })
})

route.get('/getColumnList', (req, res) => {
  const {
    user_id,
    email
  } = req.user
  const columnData = JSON.parse(JSON.stringify(req.$COLUMNLIST)).filter(column => +column.user_id === +user_id)
  utils.responseInfo(res, {
    data: columnData
  })
})



route.get('/columnInfo/:cid', async (req, res) => {
  const cid = req.params.cid
  const info = req.$COLUMNLIST.find(column => column.column_id === parseInt(cid))
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
  try {
    const {
      user_id,
      email
    } = req.user
    const {
      title,
      description,
      image
    } = req.body
    if (!user_id || (!title && !description)) {
      utils.responseInfo(res, {
        code: 1,
        codeText: "你不能创建专栏，请检查！"
      })
      return
    }
    let _id = utils.createID(req.$COLUMNLIST)
    const columnInfo = {
      _id,
      column_id: _id,
      title,
      description,
      image,
      user_id,
      createAt: new Date().toLocaleString('zh-CN', {hour12: false})
    }
    req.$COLUMNLIST.push(columnInfo)
    writeFile( `./database/column.txt`,req.$COLUMNLIST, 'utf8').then((result, err) => {
      if (err) {
        utils.responseInfo(res, {
          code: 1,
          codeText: '创建失败！'
        })
        return
      }
      utils.responseInfo(res)
    })
  } catch (e) {
    utils.responseInfo(res, {
      code: 1,
      codeText: "你不能创建专栏，请检查！"
    })
  }
})

route.post('/columnUpdate/:cid', async (req, res) => {
  const cid = req.params.cid
  const updateInfo = req.body
  let info = req.$COLUMNLIST.find(column => column.column_id === parseInt(cid))
  if (!info) {
    utils.responseInfo(res, {
      code: 1,
      codeText: "该专栏不存在！"
    })
    return
  }
  Object.assign(info, updateInfo)
  writeFile( `./database/column.txt`,req.$COLUMNLIST, 'utf8').then((result, err) => {
    if (err) {
      utils.responseInfo(res, {
        code: 1,
        codeText: "更新失败！"
      })
      return
    }
    utils.responseInfo(res)
  })
})

module.exports = route
