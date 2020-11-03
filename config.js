module.exports = {
  port: 9090,
  session: {
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24
    }
  },
  cors: {
    origin: 'http://localhost:8080',
    credentials: true,
    methods: 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
    headers: 'Authorization,Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers,RequestID,X-Content-Type-Options,X-Content-Type-Options,X-Frame-Options,X-Powered-By,X-Version,x-xss-protection,Strict-Transport-Security'
  }
}
