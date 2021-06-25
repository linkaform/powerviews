'use strict';

const { Account } = require('../models');
const Error = require('../structs/Error');

/**
 * Delete a given user
 *
 * id Integer
 * no response value expected for this operation
 **/
exports.accountsIdDELETE = async id => {
	const r = await Account.findByPk(id);
	if (!r)
		throw new Error('ENOENT');
	return await r.destroy();
};

/**
 * Retrieve a given account
 *
 * id Integer
 * returns Account
 **/
exports.accountsIdGET = async id => {
	const r = await Account.findByPk(id);
	if (!r)
		throw new Error('ENOENT');
	return r;
}

/**
 * Update a given user, cannot change id
 *
 * body Account body
 * id Integer
 * returns Account
 **/
exports.accountsIdPUT = async (body, id) => {
	let cur = await Account.findByPk(id);
	if (!cur)
		throw new Error('ENOENT');
	for (const prop in body) {
		cur[prop] = body[prop];
	}
	return await cur.save();
};

/**
 * Creates account
 *
 * body Account body
 * returns Account
 **/
exports.accountsPOST = async body => await Account.create(body);
