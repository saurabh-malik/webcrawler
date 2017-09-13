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

      resourceToVisit.push({url:resourceToCrawl.resourceURL, parentPath: ''});
      resourceDomain = resourceToCrawl.resource;
      crawlingWork(function(){console.log("Ack msg");subCh.ack(msg);});
    }catch (e) {
      closeOnErr(e);
      subCh.reject(msg, true);
    }
  }

  function crawlingWork(cb) {
    var objToCrawl = resourceToVisit.pop();
    if(objToCrawl){
      if(objToCrawl.url in resourceVisited){
        console.log("Resource already visited: " + objToCrawl.url);
        crawlingWork(cb);
      }
      else{
        console.log("URL for crawling: ", objToCrawl.url);
        resourceVisited[objToCrawl.url] = true;
        urlVisitor.visitPage(objToCrawl.url, objToCrawl.parentPath, handleResourceCrawling, cb);
      }
    }
    else{
      console.log("Crawling done");cb();
    }
  }

  function handleResourceCrawling(rsContent,pagesToVisit, ok, cb){
    if(ok){
      pagesToVisit.forEach(function(url){
          var urlDomainName = extractHostname(url);
          rsContent.resource = extractHostname(rsContent.resourceURL);
          if(resourceDomain == urlDomainName){
            if(!(url in resourceAdded)){
              resourceToVisit.push({url:url, parentPath:rsContent.sitePath});
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
    , update = {content: rsContent.content, externalResources: rsContent.externalResources,
      resourceContentName: rsContent.resourceContentName, sitePath: rsContent.sitePath,
      resource: rsContent.resource};

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
      //find & remove "wwww."
      if (url.indexOf("www.") > -1) {
        hostname = hostname.split("www.")[1];
      }

      return hostname;
  }

  return URLSubObj;
}

  module.exports = URLSub;
