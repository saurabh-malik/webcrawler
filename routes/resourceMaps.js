var resourceMapCntrl = require('../controllers/resourcemap.controller')();

module.exports = function(app){
	app.get('/api/resources/:resource', resourceMapCntrl.getResource);

	app.get('/api/resources/:resource/map', resourceMapCntrl.getResourceMap);

	app.get('/api/resources/:resource/sitemap', resourceMapCntrl.getResourceSiteMap);
}