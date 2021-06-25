'use strict';

var utils = require('../utils/writer.js');
var Pgusers = require('../service/PgusersService');

module.exports.pgusersIdDELETE = async (req, res, next, id) => {
  try {
    const response = await Pgusers.pgusersIdDELETE(id);
    utils.writeJson(res, response, 204);
  } catch (e) {
    utils.writeJson(res, e, e.error_code === 'ENOENT' ? 404 : 400);
  }
};

module.exports.pgusersIdGET = async (req, res, next, id) => {
  try {
    const response = await Pgusers.pgusersIdGET(id);
	  console.log('response', response);
    utils.writeJson(res, response, 200);
  } catch (e) {
    utils.writeJson(res, e, e.error_code === 'ENOENT' ? 404 : 400);
  }
};

module.exports.pgusersIdPUT = async (req, res, next, body, id) => {
  try {
    const response = await Pgusers.pgusersIdPUT(body, id);
    utils.writeJson(res, response, 204);
  } catch (e) {
    utils.writeJson(res, e, e.error_code === 'ENOENT' ? 404 : 400);
  }
};

module.exports.pgusersPOST = async (req, res, next, body) => {
  try {
    const response = await Pgusers.pgusersPOST(body);
    utils.writeJson(res, response, 201);
  } catch (e) {
    utils.writeJson(res, e, e.error_code === 'ENOENT' ? 404 : 400);
  }
};
