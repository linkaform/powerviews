var request = require('supertest');
var { api : { key: apikey } } = require('../config');

var app = require('../app');

describe('app', function () {
	it('should return 401 without apikey', function (done) {
		request(app)
		.post('/v1/accounts/')
		.send({a: 'b'})
		.expect(401, done) // no auth sent
	})

	it('should return 403 with wrong apikey', function (done) {
		request(app)
		.post('/v1/accounts/')
		.send({a: 'b'})
		.set('x-api-key', 'wrong_apikey')
		.expect(403, done) // bad auth sent
	})

	it('should return 400 with missing json params', function (done) {
		request(app)
		.post('/v1/accounts/')
		.send({a: 'b'})
		.set('x-api-key', apikey)
		.expect(400)
		.end(done)
	})

	it('should return 200 with ok json params', function (done) {
		request(app)
		.post('/v1/accounts/')
		.send({a: 'b'})
		.send({
			"apikey": "jwt xxxyyyzzz...",
			"name": "1259",
			"id": 1000,
			"email": "juan.perez@example.com",
			"desc": "Juan perez"
		})
		.set('x-api-key', apikey)
		.expect(200)
		.end((err, res) => console.log(err, res) || done(err))
	})
})
