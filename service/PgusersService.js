'use strict';

const db = require('../models');
const { Pguser } = db;
const Error = require('../structs/Error');

/**
 * Delete a given pguser
 *
 * id Integer 
 * returns Pguser
 **/
exports.pgusersIdDELETE = async id => {
	const r = await Pguser.findByPk(id);
	if (!r)
		throw new Error('ENOENT');
	return await r.destroy();
}

/**
 * Get a given pguser
 *
 * id Integer 
 * returns Pguser
 **/
exports.pgusersIdGET = async id => {
	const r = await Pguser.findByPk(id);
	if (!r)
		throw new Error('ENOENT');
	return r;
}

/**
 * Update a given pguser
 *
 * body Pguser posgresql user
 * id Integer 
 * returns Pguser
 **/
exports.pgusersIdPUT = async (body, id) => {
	let cur = await Pguser.findByPk(id);
	if (!cur)
		throw new Error('ENOENT');
	for (const prop in body) {
		cur[prop] = body[prop];
	}
	return await cur.save();
};

/**
 * Create PostgreSQL user with given credentials, this pgusers sees an isolated
 * set of queries
 *
 * body Pguser posgresql user
 * returns Pguser
 **/
exports.pgusersPOST = async body => await db.sequelize.transaction(async tx => {
		const pgu = await Pguser.create(body, { transaction: tx });
		await db.sequelize.query(
			`create user "${body.name}" with password '${body.pass}';`,
			{ transaction: tx }
		);
		await db.sequelize.query(
			`create schema "${body.name}";`,
			{ transaction: tx }
		);
		await db.sequelize.query(
			`grant usage on schema "${body.name}" to "${body.name}";`,
			{ transaction: tx }
		);
		await db.sequelize.query(
			`grant usage, select on all tables in schema "${body.name}" to "${body.name}";`,
			{ transaction: tx }
		);
		return pgu;
	});
