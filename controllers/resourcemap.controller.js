"use strict";
var Resource = require('../models/resourcecontent.model');

var ResourceMapCntrl = function(){
	var ResourceMapsObj = {};

	ResourceMapsObj.getResource = function(req, res, next){
		Resource.find({resource:req.params.resource, sitePath:",home,"},{resource:1, resourceContentName:1, resourceURL:1, sitePath:1, externalResources:1}, function(err, content){
			if(!err){
				res.json({status: true, resource: content});
			}else{
				res.json({status: false, message: "Invalid resource"});
			}
		});
	}

	ResourceMapsObj.getResourceMap = function(req, res, next){
		Resource.find({resource:req.params.resource, sitePath:/^,home,/}, {resource:1, resourceContentName:1, resourceURL:1, sitePath:1, externalResources:1}, function(err, contents){
			if(!err){
				res.json({status: true, resourceSiteMap: contents});
			}else{
				res.json({status: false, message: "Some Error has occured."});
			}
		});
	}

	ResourceMapsObj.getResourceSiteMap = function(req, res, next){
		Resource.find({resource:req.params.resource, sitePath:/^,home,/}, {resource:1, resourceContentName:1, resourceURL:1, sitePath:1, externalResources:1}, function(err, contents){
			if(!err){
				//Convert to sitemap
				var siteMap = convertMapToSiteMap(contents);

				res.render('../views/sitemap', {
					title: req.params.resource + " - Site Map",
			        siteMap: siteMap
			    });

			}else{
				res.render('../views/error', {
			        message: "Some error has occured",
			        error: err

			    });
			}
		});
	}

	function convertMapToSiteMap(maps){
		var sm = [];
		maps.forEach(function(rs){
			var hierarchy = rs.sitePath.split(',');
			var currentNode = sm;
			for (var j = 0; j < hierarchy.length; j++) {
				var wantedNode = hierarchy[j];
				var lastNode = currentNode;
				for (var k = 0; k < currentNode.length; k++) {
		            if (currentNode[k].resource == wantedNode) {
		                currentNode = currentNode[k].children;
		                break;
		            }
		        }
		        // If we couldn't find an item in this list of children
		        // that has the right name, create one:
		        if (lastNode == currentNode) {
		        	var currentResource = {};
		        	maps.forEach(function(rsrc){
		        		console.log(rsrc.resourceContentName)
		        		console.log(wantedNode)
		        		if(rsrc.resourceContentName == wantedNode){
		        			currentResource = rsrc;
		        		}
		        	});
		            var newNode = currentNode[k] = {resource: wantedNode, url: currentResource.resourceURL, children: []};
		            currentNode = newNode.children;
		        }
			}
		})
		return sm;
	}

	return ResourceMapsObj;
}

module.exports = ResourceMapCntrl;