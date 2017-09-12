"use strict";

var urlVisitor = require('../crawler/pagevisitor')();
var RSContent = require('../models/resourcecontent.model')

var URLSub = function(AMQPConn){

  var URLSubObj = {};
  var subCh;

  var resourceVisited;
  var resourceToVisit;
  var resourceAdded;
  var resourceDomain;



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
    try{
      resourceVisited = {};
      resourceToVisit = [];
      resourceAdded = {};
      var resourceToCrawl = JSON.parse(msg.content.toString());

      resourceToVisit.push(resourceToCrawl.resourceURL);
      resourceDomain = resourceToCrawl.resource;
      crawlingWork(function(){console.log("Ack msg");subCh.ack(msg);});
    }catch (e) {
      closeOnErr(e);
      subCh.reject(msg, true);
    }
  }

  function crawlingWork(cb) {
    var urlToCrawl = resourceToVisit.pop();
    if(urlToCrawl){
      console.log("URL for crawling: ", urlToCrawl);
      if(urlToCrawl in resourceVisited){
        console.log("Resource already visited: " + urlToCrawl);
        crawlingWork(cb);
      }
      else{
        resourceVisited[urlToCrawl] = true;
        urlVisitor.visitPage(urlToCrawl, handleResourceCrawling, cb);
      }
    }
    else{
      console.log("Crawling done");cb();
    }
  }

  function handleResourceCrawling(resourceUrl,pagesToVisit,content, ok, cb){
    if(ok){
      var rsContent = new RSContent();
      rsContent.resourceURL = resourceUrl;
      rsContent.content = content;
      pagesToVisit.forEach(function(url){
          var urlDomainName = extractHostname(url);
          if(resourceDomain == urlDomainName){
            if(!(url in resourceAdded)){
              resourceToVisit.push(url);
              resourceAdded[url] = true;
            }
          }
          else{rsContent.externalResources.push(url);}
        });

      updateResourceContent(rsContent, function(err, obj){
        if(err){
          console.log("Error while updating rscontent: " + err);
        }
        crawlingWork(cb);
      });
    }
  }

  function closeOnErr(err) {
    if (!err) return false;
    console.error("[AMQP] error", err);
    AMQPConn.close();
    return true;
  }

  function updateResourceContent(rsContent, cb){
    var condition = {resourceURL: rsContent.resourceURL}
    , update = {content: rsContent.content, externalResources: rsContent.externalResources};

    RSContent.findOneAndUpdate(condition, update, {upsert:true}, cb);
  }

  function extractRootDomain(url) {
      var domain = extractHostname(url),
          splitArr = domain.split('.'),
          arrLen = splitArr.length;

      //extracting the root domain here
      if (arrLen > 2) {
          domain = splitArr[arrLen - 2] + '.' + splitArr[arrLen - 1];
      }
      return domain;
  }

  function extractHostname(url) {
      var hostname;
      //find & remove protocol (http, ftp, etc.) and get hostname

      if (url.indexOf("://") > -1) {
          hostname = url.split('/')[2];
      }
      else {
          hostname = url.split('/')[0];
      }

      //find & remove port number
      hostname = hostname.split(':')[0];
      //find & remove "?"
      hostname = hostname.split('?')[0];

      return hostname;
  }

  return URLSubObj;
}

  module.exports = URLSub;
