'use strict';

var utils = require('../utils/writer.js');
var Queries = require('../service/QueriesService');

module.exports.queriesIdDELETE = async (req, res, next, id) => {
  try {
    const response = await Queries.queriesIdDELETE(id);
    utils.writeJson(res, response, 204);
  } catch (e) {
    utils.writeJson(res, e, e.error_code === 'ENOENT' ? 404 : 400);
  }
};

module.exports.queriesIdGET = async (req, res, next, id) => {
  try {
    const response = await Queries.queriesIdGET(id);
    utils.writeJson(res, response, 200);
  } catch (e) {
    utils.writeJson(res, e, e.error_code === 'ENOENT' ? 404 : 400);
  }
};

module.exports.queriesIdPUT = async (req, res, next, body, id) => {
  try {
    const response = await Queries.queriesIdPUT(body, id);
    utils.writeJson(res, response, 204);
  } catch (e) {
    utils.writeJson(res, e, e.error_code === 'ENOENT' ? 404 : 400);
  }
};

module.exports.queriesPOST = async (req, res, next, body) => {
  try {
    const response = await Queries.queriesPOST(body);
    utils.writeJson(res, response, 201);
  } catch (e) {
    utils.writeJson(res, e, e.error_code === 'ENOENT' ? 404 : 400);
  }
};

module.exports.queriesIdRefreshPUT = async (req, res, next, id) => {
  try {
    const response = await Queries.queriesIdRefreshPUT(id);
    utils.writeJson(res, response, 204);
  } catch (e) {
    utils.writeJson(res, e, e.error_code === 'ENOENT' ? 404 : 400);
  }
};
