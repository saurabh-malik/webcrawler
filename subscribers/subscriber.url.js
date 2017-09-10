"use strict";

var urlVisitor = require('../crawler/pagevisitor')();

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
    work(msg, function(pagesToVisit, ok) {
      try {
        if (ok){
          console.log("Number of links for further visit: " + pagesToVisit.length)
          console.log(pagesToVisit)
          subCh.ack(msg);
        }
        else
          subCh.reject(msg, true);
      } catch (e) {
        closeOnErr(e);
      }
    });
  }

  function work(msg, cb) {
    var resource = JSON.parse(msg.content.toString());
    console.log("URL for crawling: ", resource.resourceURL);
    urlVisitor.visitPage(resource.resourceURL, cb);
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
