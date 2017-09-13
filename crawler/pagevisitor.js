"use strict";
var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');
var RSContent = require('../models/resourcecontent.model');




var Visitor = function(){

	var VisitorObj = {};

	var SEARCH_WORD = "stemming";
	var MAX_PAGES_TO_VISIT = 10;

	var pagesVisited = {};
	var numPagesVisited = 0;
	var pagesToVisit = [];
	var baseUrl;


	VisitorObj.visitPage = function(url, parentPath, callback,cb) {

		//url = START_URL;
		baseUrl = url;
	  // Add page to our set
	  pagesVisited[url] = true;
	  numPagesVisited++;

	  var $;

	  // Make the request
	  console.log("Visiting page " + url);
	  request(url, function(error, response, body) {
	     // Check status code (200 is HTTP OK)
	     console.log("Status code: " + response.statusCode);
	     if(response.statusCode !== 200) {
	       callback(url,pagesToVisit,body, false, cb);
	       return;
	     }
	     // Parse the document body
	     $ = cheerio.load(body);
	     collectInternalLinks($);
	     var title = $("title").text();
	     console.log("Page Title- " + title);
	     var rsCont = new RSContent();
	     rsCont.resourceContentName = title;
	     rsCont.resourceURL = url;
	     rsCont.content = body;
	     if(parentPath==''){
	     	rsCont.sitePath = ",home,";
	     }else{
	     	rsCont.sitePath = parentPath+title+",";
	     }
	     callback(rsCont, pagesToVisit, true, cb);
	  });
	}

	function collectInternalLinks($) {
	    var relativeLinks = $("a[href^='http://'], a[href^='https://']");
	    console.log("Found " + relativeLinks.length + " relative links on page");
	    relativeLinks.each(function() {
	    	var nextURL = $(this).attr('href');
	    	if(!(nextURL in pagesVisited)){
	    		pagesVisited[nextURL] = true;
	    		pagesToVisit.push(nextURL);
	    	}
	    });
	}

	function getResourceName($){

	}
	return VisitorObj;
}
module.exports = Visitor;