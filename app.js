const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const hbs = require("hbs")
const session = require("express-session")
const db = require("./config/connection")
const adminRouter = require('./routes/admin');
const usersRouter = require('./routes/users');
const partialsPath = path.join(__dirname, "views/partials");

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
hbs.registerPartials(partialsPath)

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
//database connection
db.connect((err) => {
  if (err) console.log("Connection error" + err);
  else console.log("connected to database");
})
// session
app.use(session({
  secret: "secret",
  resave: false,
  saveUninitialized: true,
  cookie: {}
}))
///cache control
app.use((req, res, next) => {
  res.set('cache-control', 'no-cache,private,no-store,must-revalidate,max-sate=0,post-check=0');
  next();
});

app.use('/admin', adminRouter);
app.use('/', usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
