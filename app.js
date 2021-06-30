'use strict';

var path = require('path');

var oas3Tools = require('oas3-tools');
var config = require('./config');

var validateApiKey = async (req, scopes, schema) => {
	if (req.get('x-api-key') === config.api.key)
		return true; // valid powerviews rest api user
	throw { status: 403, message: 'no valid api key in X-API-KEY header provided' }
};

// swaggerRouter configuration
var options = {
    routing: {
        controllers: path.join(__dirname, './controllers')
    },
    openApiValidator: {
	    validateSecurity: {
			handlers: {
					ApiKeyAuth: validateApiKey
			}
		}
	}
};

if (!config.api.key) {
		throw 'no api key for access to powerviews configured, see ./config/config.json';
}

var expressAppConfig = oas3Tools.expressAppConfig(path.join(__dirname, 'api/openapi.yaml'), options);
expressAppConfig.addValidator();
var app = expressAppConfig.getApp();

module.exports = app;
