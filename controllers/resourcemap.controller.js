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

	return ResourceMapsObj;
}

module.exports = ResourceMapCntrl;