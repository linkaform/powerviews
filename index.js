'use strict';

var http = require('http');
var app = require('./app');
var serverHost = '127.0.0.1';
var serverPort = 8080;

// Initialize the Swagger middleware
http.createServer(app).listen(serverPort, serverHost, function () {
    console.log('Your server is listening on port %d (http://localhost:%d)', serverPort, serverPort);
    console.log('Swagger-ui is available on http://localhost:%d/docs', serverPort);
});
