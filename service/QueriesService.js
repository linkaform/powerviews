'use strict';

const db = require('../models');
const { Query, Pguser } = db;

const Error = require('../structs/Error');

/**
 * Delete a given Query
 *
 * id Integer
 * returns Query
 **/
exports.queriesIdDELETE = async id => await db.sequelize.transaction(async tx => {
	const r = await Query.findByPk(id, { transaction: tx })
	if (!r)
		throw new Error('ENOENT');
	const pguser = await r.getPguser({ transaction: tx });
	await db.sequelize.query(`drop table if exists "${pguser.name}"."${r.table}" cascade;`, { transaction: tx });
	return await r.destroy({ transaction: tx });
})


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
exports.queriesIdPUT = async (body, id) => await db.sequelize.transaction(async tx => {
	const cur = await Query.findByPk(id, { include: [{ all: true }], transaction: tx });
	const old = cur.toJSON();

	if (!cur)
		throw new Error('ENOENT');
	for (const prop in body) {
		cur[prop] = body[prop];
	}
	if (body.view && body.view !== old.view)
		await db.sequelize.query(
			`alter view if exists "${cur.Pguser.name}.${old.view}" rename to "${cur.Pguser.name}.${cur.view}";`,
			{ transaction: tx }
		);

	return await cur.save({ transaction: tx });
});

/**
 * Create query
 *
 * body Query Query to run against mongodb and show to final user
 * returns Query
 **/
exports.queriesPOST = async body => await db.sequelize.transaction(async tx => {
	const r = await Query.create(body, { transaction: tx })
	const pguser = await r.getPguser({ transaction: tx });
	await db.sequelize.query(`drop table if exists "${pguser.name}"."${r.table}" cascade;`, { transaction: tx });
	await db.sequelize.query(`create table "${pguser.name}"."${r.table}" (data jsonb);`, { transaction: tx });
	await db.sequelize.query(`grant select on table "${pguser.name}"."${r.table}" to "${pguser.name}";`, { transaction: tx });
	return r;
})

/**
 * queue a given query for process as soon as possible
 *
 * id Integer
 * returns Query
 **/
exports.queriesIdRefreshPUT = async id => await db.sequelize.transaction(async tx => {
	const cur = await Query.findByPk(id, { transaction: tx });
	const r = cur; // for consistency
	const pguser = await cur.getPguser({ transaction: tx });
	if (!cur)
		throw new Error('ENOENT');
	cur.state = 'inqueue';
	await db.sequelize.query(`drop table if exists "${pguser.name}"."${r.table}" cascade;`, { transaction: tx });
	await db.sequelize.query(`create table "${pguser.name}"."${r.table}" (data jsonb);`, { transaction: tx });
	await db.sequelize.query(`grant select on table "${pguser.name}"."${r.table}" to "${pguser.name}";`, { transaction: tx });
	return await cur.save({ transaction: tx });
});

/**
 * Get list of queries that match a given script_id, include full pgusers data
 *
 * id Integer
 * returns Query
 **/
exports.queriesScript_idIdGET = async id => {
	const r = await Query.findAll({
		where: {
			script_id: id
		},
		include: [
			Pguser
		]
	});
	if (!r || !Array.isArray(r) || r.length <= 0)
		throw new Error('ENOENT');
	return r;
}
