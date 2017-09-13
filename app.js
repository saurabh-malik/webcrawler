var amqp = require('amqplib/callback_api');
var mongoose = require('mongoose');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');


var app = express();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


require('./routes/resourceMaps')(app);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// Use native Node promises
mongoose.Promise = global.Promise;
// connect to MongoDB
mongoose.connect('mongodb://localhost/resource-content')
  .then(() =>  console.log('connection succesful'))
  .catch((err) => console.error(err));

var amqpConn = null;
amqp.connect("amqp://localhost" + "?heartbeat=60", function(err, conn) {
    if (err) {
      console.error("[AMQP]", err.message);
    }
    conn.on("error", function(err) {
      if (err.message !== "Connection closing") {
        console.error("[AMQP] conn error", err.message);
      }
    });
    conn.on("close", function() {
      console.error("[AMQP] reconnecting");
    });

    console.log("[AMQP] connected");
    amqpConn = conn;
    var urlSubscriber = require('./subscribers/subscriber.url')(amqpConn);

    urlSubscriber.StartSubscriber();

  });

module.exports = app;
