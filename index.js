'use strict';

var path = require('path');
var http = require('http');

var oas3Tools = require('oas3-tools');
var config = require('./config');
var serverHost = '127.0.0.1';
var serverPort = 8080;

var validateApiKey = async (req, scopes, schema) => {
	console.log('x-api-key', req.get('x-api-key'));
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

// Initialize the Swagger middleware
http.createServer(app).listen(serverPort, serverHost, function () {
    console.log('Your server is listening on port %d (http://localhost:%d)', serverPort, serverPort);
    console.log('Swagger-ui is available on http://localhost:%d/docs', serverPort);
});
