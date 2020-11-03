const express = require("express")
const route = express.Router()
const fs = require('fs')
const multer = require("multer")
const utils = require('../lib/utils')

const storage = multer.diskStorage({
  destination (req, file, cb) {
    cb(null, './database/upload')
  },
  filename (req, file, cb) {
    let name = (new Date().getTime())+'-'+file.originalname
    cb(null, name)
  }
})

const upload = multer({ storage: storage })
route.use(upload.any())

route.post('/upload', (req, res) => {
  console.log(req.files)
  if (req.files && req.files.length !== 0) {
    if (req.files[0].originalname) {
      let path = req.files[0].path.replace('database', 'http://localhost:9090')
      const imageInfo = {
        filename: req.files[0].filename,
        original_name: req.files[0].originalname,
        path,
        mime_type: req.files[0].mimetype,
        size: req.files[0].size
      }
      // console.log(imageInfo)
      utils.responseInfo(res, {
        data: imageInfo
      })
    } else {
      fs.unlink(req.files[0].path, err => {
        if (err) {
          utils.responseInfo(res, {
            code: 1,
            codeText: "图片上传失败"
          })
        }
      })
    }
  }
})

// route.get('/upload', (req, res) => {
//   console.log('upload')
//   console.log(req)
// })

module.exports = route
