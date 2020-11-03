const express = require("express");
const route = express.Router();
const myFs = require('../lib/myFs');
const utils = require('../lib/utils');
const jwt = require('jsonwebtoken')

// 首先要获取数据库中的数据
route.use(async (req, res, next) => {
  try {
    req.$USERS = await myFs.readFile('./database/users.txt', 'utf8')
    if (!req.$USERS) {
      req.$USERS = []
    } else {
      req.$USERS = JSON.parse(req.$USERS)
    }
  } catch (e) {
    console.log(e)
  }
  next()
});

route.post('/register', (req, res) => {
  let isRegister = ''
  const {
    email,
    password,
    nickName
  } = req.body
  isRegister = req.$USERS.find(user => user.email === email)
  if (isRegister) {
    utils.responseInfo(res,  {
      code: 1,
      codeText: '该用户的邮箱已注册，请直接登录'
    })
    return
  }
  let _id = utils.createID(req.$USERS)
  const userInfo = {
    _id,
    email,
    password,
    nickName,
    description: '',
    avatar: '',
    column: '',
    createdTime: new Date().toLocaleString('zh-CN', {hour12: false})
  }
  req.$USERS.push(userInfo)
  myFs.writeFile('./database/users.txt', req.$USERS, 'utf8').then((result, err) => {
    console.log('注册时写入数据库: ', result, err)
    if (err) {
      utils.responseInfo(res, {
        code: 1,
        codeText: '注册失败，请检查后重新注册！'
      })
      return
    }
    utils.responseInfo(res)
  })
});

route.post('/login', async (req, res) => {
  let hasUser = ''
  const {
    email,
    password,
    nickName
  } = req.body;
  hasUser = req.$USERS.find(user => {
    return user.email === email && user.password == password
  });
  if (!hasUser) {
    utils.responseInfo(res, {
      code: 1,
      codeText: '该用户没有注册，请注册后登录！'
    });
    return
  }
  const generatJwt = jwt.sign({
    _id: hasUser._id,
    email: hasUser.email
  }, 'secret12345', {
      expiresIn: 60 * 60 * 24
    }
  )
  const token = `Bearer ${generatJwt}`
  res.cookie('uid', hasUser._id, { maxAge:1000 * 60 * 60 * 24, signed:true })
  res.cookie('email', hasUser.email, { maxAge:1000 * 60 * 60 * 24, signed:true })
  req.session.userID = hasUser._id;
  utils.responseInfo(res, { data: { token } })
});


route.get('/currentUser', async (req, res) => {
  if (req.user) {
    let userInfo = ''
    const {
      _id,
      email
    } = req.user

    userInfo = req.$USERS.find(user => {
      return user.email === email && user._id == _id
    });
    if (!userInfo) {
      utils.responseInfo(res, {
        code: 1,
        codeText: '该用户没有注册，请注册后登录！'
      });
      return
    }
    utils.responseInfo(res, {
      data: userInfo
    })
  } else {
    utils.responseInfo(res, {
      code: 1,
      codeText: '该用户没有注册，请注册后登录！'
    });
  }
})

route.get('/logout', async (req, res) => {
  // let userSession = await myFs.readFile('./database/session.txt', 'utf8')
  // userSession = JSON.parse(userSession)
  // let index = userSession.find(session => session.userID === req.session.userID)
  // if (index) {
  //   userSession.splice(index, 1)
  let hasUser = ''
  hasUser = req.$USERS.find(user => {
    return parseInt(user._id) === parseInt(req.signedCookies.uid)
  });
  if (!hasUser) {
    utils.responseInfo(res, {
      code: 1,
      codeText: '退出失败！'
    });
    return
  }

  req.session.userID = null
  res.cookie('uid', hasUser._id, { maxAge:0, signed:true })
  res.cookie('email', hasUser.email, { maxAge:0, signed:true })
  utils.responseInfo(res, {
    codeText: "退出成功"
  })
  // }
})

module.exports = route
