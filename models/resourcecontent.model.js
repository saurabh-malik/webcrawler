var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Web Resource schema
var RSContentSchema = new Schema({
	resource: String,
	resourceContentName: String,
	resourceURL: String,
	content: String,
	images: [String],
	sitePath: String,
	externalResources: [String],
	createdAt: { type: Date, default: Date.now }
});


var ResourceModel = mongoose.model('resourceContent', RSContentSchema);

module.exports = ResourceModel;