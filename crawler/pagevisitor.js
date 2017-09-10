"use strict";
var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');


var Visitor = function(){

	var VisitorObj = {};

	var SEARCH_WORD = "stemming";
	var MAX_PAGES_TO_VISIT = 10;

	var pagesVisited = {};
	var numPagesVisited = 0;
	var pagesToVisit = [];
	var baseUrl;


	VisitorObj.visitPage = function(url, callback) {

		//url = START_URL;
		baseUrl = url;
	  // Add page to our set
	  pagesVisited[url] = true;
	  numPagesVisited++;

	  // Make the request
	  console.log("Visiting page " + url);
	  request(url, function(error, response, body) {
	     // Check status code (200 is HTTP OK)
	     console.log("Status code: " + response.statusCode);
	     if(response.statusCode !== 200) {
	       callback(pagesToVisit, false);
	       return;
	     }
	     // Parse the document body
	     var $ = cheerio.load(body);
	     console.log("body: "+$)
	     collectInternalLinks($);
	     callback(pagesToVisit, true);
	  });
	}

	function collectInternalLinks($) {
	    var relativeLinks = $("a[href^='http://']");
	    console.log("Found " + relativeLinks.length + " relative links on page");
	    relativeLinks.each(function() {
	    	var nextURL = $(this).attr('href');
	    	if(nextURL in pagesVisited){
	    		console.log("Already added: " + nextURL)
	    	}
	    	else{
	    		pagesVisited[nextURL] = true;
	    		pagesToVisit.push(nextURL);
	    	}
	    });
	}
	return VisitorObj;
}
module.exports = Visitor;