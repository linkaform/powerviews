'use strict';

const { Query } = require('../models');
const Error = require('../structs/Error');

/**
 * Delete a given Query
 *
 * id Integer
 * returns Query
 **/
exports.queriesIdDELETE = async id => {
	const r = await Query.findByPk(id);
	if (!r)
		throw new Error('ENOENT');
	return await r.destroy();
}


/**
 * Get a given Query
 *
 * id Integer
 * returns Query
 **/
exports.queriesIdGET = async id => {
	const r = await Query.findByPk(id);
	if (!r)
		throw new Error('ENOENT');
	return r;
}

/**
 * Update a given query
 *
 * body Query Query to run against mongodb and show to final user
 * id Integer
 * returns Query
 **/
exports.queriesIdPUT = async (body, id) => {
	let cur = await Query.findByPk(id);
	if (!cur)
		throw new Error('ENOENT');
	for (const prop in body) {
		cur[prop] = body[prop];
	}
	return await cur.save();
};

/**
 * Create query
 *
 * body Query Query to run against mongodb and show to final user
 * returns Query
 **/
exports.queriesPOST = async body => await Query.create(body)
