const { MongoClient } = require('mongodb');
const fetch = require('node-fetch');
const db = require('../models');
const { Query } = db;

let LKFPOWERVIEWSENGINELOGINUSER;
let LKFPOWERVIEWSENGINELOGINAPIKEY;
let LKFPOWERVIEWSENGINEMONGOURL;

const getconfig = () => {
	({ LKFPOWERVIEWSENGINELOGINUSER, LKFPOWERVIEWSENGINELOGINAPIKEY, LKFPOWERVIEWSENGINEMONGOURL } = process.env);
	if (!LKFPOWERVIEWSENGINELOGINUSER || !LKFPOWERVIEWSENGINELOGINAPIKEY || !LKFPOWERVIEWSENGINEMONGOURL)
		throw 'error LKFPOWERVIEWSENGINELOGINUSER, LKFPOWERVIEWSENGINELOGINAPIKEY and LKFPOWERVIEWSENGINEMONGOURL variables required in engine environment'
}

const queryclean = json => {
	switch (typeof json) {
		case 'string': {
			let match, p1;
			[ match, p1 ] = /ISODate\("([^\)]+)"\)/.exec(json) || [];
			return match ? new Date(p1) : json;
		}
		case 'object': {
			if (json === null)
				return json;
			if (Array.isArray(json))
				return json.map(x => queryclean(x))

			let nobj = {};
			for (k in json) {
				nobj[k] = queryclean(json[k])
			}
			return nobj
		}
		default: return json;
	}
};

const dologin = async () => {
	const body = {
		username: LKFPOWERVIEWSENGINELOGINUSER,
		api_key: LKFPOWERVIEWSENGINELOGINAPIKEY
	};
	const url = 'https://app.linkaform.com/api/infosync/user_admin/login/';
	const res = await fetch(url, {
		method: 'post',
		body: JSON.stringify(body),
		headers: { 'content-type': 'application/json' }
	});
	const json = await res.json();
	if (!json.success)
		throw `${url} not success` + (json.error ? `, error: ${json.error}` : '');
	return json
};

const getqueryres = async (jwt, script_id) => {
	const url = 'https://app.linkaform.com/api/infosync/scripts/run/';
	const res = await fetch(url, {
		method: 'post',
		body: JSON.stringify({ script_id: script_id}),
		headers: { 'content-type': 'application/json' }
	});
	const json = await res.json();
	if (!json.success)
		throw `${url} not success` + (json.error ? `, error: ${json.error}` : '');
	return json.response;
};

const querymongo = async data => {
	const url = LKFPOWERVIEWSENGINEMONGOURL;
	const client = await MongoClient.connect(url);

	//console.log('data', JSON.stringify(data, null, "  "));
	const db = client.db(data.db_name);
	try {
		const res = db.collection(data.collection)[data.command](data.query);
		return await res.toArray();
	} finally {
		client.close();
	}
};

// gets array of work to do from postgresql, return includes:
// 	script_id,
// 	table
//
const getpgqueries = async () => {
	const queries = (await db.sequelize.query(`
		update queries
		set	state = 'inqueue'
		where	extract(epoch from 'now'::timestamptz)::int >=
			last_refresh + refresh
		returning *;
		`,
		{
			model: Query,
			mapToModel: Query
		}
	))
	for (q of queries) {
		q.Pguser = await q.getPguser();
	}
	return queries;
};
	//await Query.findAll({
		//include: [{ all: true }]
	//});

const main = async () => {
	const pgqueries = await getpgqueries();
	console.log('XXXXXXXXXXXXXXXXXXXXXX');
	//console.log('pgqueries', pgqueries);
	console.log('pgqueries', pgqueries.map(({ id, script_id, Pguser: {name: pgusername }}) => ({ id, script_id, pgusername })));
	//return;
	for (pgq of pgqueries) {
		try {
			pgq.state = 'working';
			pgq.last_query = await getqueryres((await dologin()).jwt, pgq.script_id);
			await pgq.save(); // store last query in pg db
			const mongodata = await querymongo(queryclean(pgq.last_query));
			console.log('res size', JSON.stringify(mongodata).length);
			// insert into table in namespace of pguser
			await db.sequelize.transaction(async tx => {
				await db.sequelize.query(
					`set local search_path = "${pgq.Pguser.name}";`,
					{ transaction: tx }
				);
				await db.sequelize.query(
					`truncate "${pgq.table}";`,
					{ transaction: tx }
				);
				await db.sequelize.getQueryInterface()
					.bulkInsert(
						pgq.table,
						mongodata.map(x => ({ data: JSON.stringify(x) })),
						{ transaction: tx }
					);
			})
			pgq.last_error = null;
			const now = new Date() / 1000;
			pgq.state = 'success';
			pgq.last_refresh = now;
			pgq.last_try = now;
			await pgq.save();
		} catch (e) {
			console.log(e);
			try {
				pgq.state = 'error';
				// report and save this query error but continue
				// with remaining ones
				pgq.last_error = e.toString();
				pgq.last_try = new Date() / 1000;
				await pgq.save();
			} catch (e) {
				console.log(e);
			}
		}
	}
};

const loop = async() => {
	try {
		await main();
	} catch (e) {
		console.log(e);
	} finally {
		setTimeout(loop, 1000);

	}
}

getconfig();
loop();
