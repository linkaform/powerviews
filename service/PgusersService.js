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
exports.pgusersIdDELETE = async id => await db.sequelize.transaction(async tx => {
	const r = await Pguser.findByPk(id, { transaction: tx });
	if (!r)
		throw new Error('ENOENT');

	await db.sequelize.query(
		`drop schema if exists "${r.name}" cascade`,
		{ transaction: tx }
	);
	await db.sequelize.query(
		`drop role if exists "${r.name}";`,
		{ transaction: tx }
	);
	return await r.destroy();
});

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
exports.pgusersIdPUT = async (body, id) => await db.sequelize.transaction(async tx => {
	const cur = await Pguser.findByPk(id, { transaction: tx });
	const old = cur.toJSON();

	if (!cur)
		throw new Error('ENOENT');
	// apply validations first
	for (const prop in body) {
		cur[prop] = body[prop];
	}
	if (body.name && old.name !== body.name) {
		await db.sequelize.query(
			`alter schema "${old.name}" rename to "${cur.name}";`,
			{ transaction: tx }
		);
		await db.sequelize.query(
			`alter role "${old.name}" rename to "${cur.name}";`,
			{ transaction: tx }
		);
	}
	if (body.pass && old.pass !== body.pass) {
		await db.sequelize.query(
			`alter role "${old.name}" password '${body.pass}';`,
			{ transaction: tx }
		);
	}
	return await cur.save({ transaction: tx });
});

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
		`create user "${body.name}" with noinherit password '${body.pass}' in role powerviews_users;`,
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

/**
 * returns array of pgusers matching a given account_id
 *
 * id Integer 
 * returns Pguser
 **/
exports.pgusersAccount_idIdGET = async id => {
	const r = await Pguser.findAll({
		where: {
			account_id: id
		}
	});
	if (!r || !Array.isArray(r) || r.length <= 0)
		throw new Error('ENOENT');
	return r;
}
