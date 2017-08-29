"use strict";

var URLSub = function(AMQPConn){

  var URLSubObj = {};

  var subCh;

  URLSubObj.StartSubscriber = function(){

    AMQPConn.createChannel(function(err, ch) {
      if (closeOnErr(err)) return;
      ch.on("error", function(err) {
        console.error("[AMQP] channel error", err.message);
      });
      ch.on("close", function() {
        console.log("[AMQP] channel closed");
      });
      subCh = ch;
      ch.prefetch(10);
      ch.assertQueue("url", { durable: true }, function(err, _ok) {
        if (closeOnErr(err)) return;
        // Bind with exchange
        ch.bindQueue("url","exchng-url","",{}, function(err, _ok){
          if (closeOnErr(err)) return;
          ch.consume("url", processURL, { noAck: false });
          console.log("Webcrawler listener is started");
        })
        
      });
    });
  }

  function processURL(msg){
    console.log("New URL for crawling received")
    work(msg, function(ok) {
      try {
        if (ok)
          subCh.ack(msg);
        else
          subCh.reject(msg, true);
      } catch (e) {
        closeOnErr(e);
      }
    });
  }

  function work(msg, cb) {
    console.log("PDF processing of ", msg.content.toString());
    cb(true);
  }

  function closeOnErr(err) {
  if (!err) return false;
  console.error("[AMQP] error", err);
  AMQPConn.close();
  return true;
}

  return URLSubObj;
}

  module.exports = URLSub;
