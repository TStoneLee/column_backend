const express = require('express');
const session =  require('express-session');
const bodyParser =  require('body-parser');
const cookieParser = require('cookie-parser')
const expressJwt = require('express-jwt')
const path = require('path')

const config = require('./config');

const app = express();

app.listen(config.port, () => {
  console.log('CREATE SERVICE SUCCESS!');
});
app.use((req, res, next) => {
  // CORS跨域处理的中间件
  res.header('Access-Control-Allow-Origin', config.cors.origin);
  res.header('Access-Control-Allow-Methods', config.cors.methods); // If needed
  res.header('Access-Control-Allow-Headers', config.cors.headers);// If needed
  res.header('Access-Control-Allow-Credentials', config.cors.credentials);

  // 试探性请求，判断资源是否存在
  /^OPTION$/i.test(req.method) ? res.send('CURRENT SERVEICES  SUPPORT CROSS DOMAIN REQUESTS!') : next()
});

app.use(expressJwt({
  secret: 'secret12345', // 签名的密钥 或 PublicKey
  algorithms: ['HS256'],
  credentialsRequired: false
}).unless({
  path: ['/user/register', '/user/logout', '/user/login', '/column/columnList']  // 指定路径不经过 Token 解析
}))

// app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cookieParser('keyboard cat'))


app.use(session(config.session));

const options =

app.use(express.static(path.join(__dirname, 'database'), {
  setHeaders(res, path, stat) {
    // console.log(22)
    // res.setHeader("content-type", "image/png")
  }
}))


app.use('/user', require('./routes/user'));
app.use('/column', require('./routes/column'));
app.use('/post', require('./routes/post'));
app.use('/file', require('./routes/file'));

