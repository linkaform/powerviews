'use strict';

var utils = require('../utils/writer.js');
var Accounts = require('../service/AccountsService');

module.exports.accountsIdDELETE = async (req, res, next, id) => {
  try {
    const response = await Accounts.accountsIdDELETE(id);
    utils.writeJson(res, response, 204);
  } catch (e) {
    utils.writeJson(res, e, e.error_code === 'ENOENT' ? 404 : 400);
  }
};

module.exports.accountsIdGET = async (req, res, next, id) => {
  try {
    const response = await Accounts.accountsIdGET(id);
    utils.writeJson(res, response, 200);
  } catch (e) {
    utils.writeJson(res, e, e.error_code === 'ENOENT' ? 404 : 400);
  }
};

module.exports.accountsIdPUT = async (req, res, next, body, id) => {
  try {
    const response = await Accounts.accountsIdPUT(body, id);
    utils.writeJson(res, response, 204);
  } catch (e) {
    utils.writeJson(res, e, e.error_code === 'ENOENT' ? 404 : 400);
  }
};

module.exports.accountsPOST = async (req, res, next, body) => {
  try {
    const response = await Accounts.accountsPOST(body);
    utils.writeJson(res, response, 201);
  } catch (e) {
    utils.writeJson(res, e, e.error_code === 'ENOENT' ? 404 : 400);
  }
};
