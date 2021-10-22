const { MongoClient } = require('mongodb');
const fetch = require('node-fetch');
const urlparse = require('url-parse');
const fetch_to_curl = require('fetch-to-curl').default;
const db = require('../models');
const trunc_string = require('../utils/trunc_string');
const { Query } = db;

let LKFPOWERVIEWSENGINEMONGOURL;
let LKFPOWERVIEWSENGINECOUCHURL;

const getconfig = () => {
	({ LKFPOWERVIEWSENGINEMONGOURL, LKFPOWERVIEWSENGINECOUCHURL  } = process.env);
	if (!LKFPOWERVIEWSENGINEMONGOURL)
		throw 'error LKFPOWERVIEWSENGINEMONGOURL variable required in engine environment'
	if (!LKFPOWERVIEWSENGINECOUCHURL)
		throw 'error LKFPOWERVIEWSENGINECOUCHURL variable required in engine environment'
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

const dologin = async (username, api_key) => {
	let body = { username, api_key };
	const bodyserialized = process.env.LKFPOWERVIEWSENGINELKFLOGINOVERRIDE || JSON.stringify(body);
	console.log('dologin', bodyserialized);
	const url = 'https://app.linkaform.com/api/infosync/user_admin/login/';
	const res = await fetch(url, {
		method: 'post',
		body: bodyserialized,
		headers: { 'content-type': 'application/json' }
	});
	const json = await res.json();
	if (!json.success)
		throw `${url} not success` + (json.error ? `, error: ${json.error}` : '');
	return json.jwt;
};

const getqueryres = async (jwt, script_id) => {
	const url = 'https://app.linkaform.com/api/infosync/scripts/run/';
	console.log('request', fetch_to_curl(url, {
		method: 'post',
		body: JSON.stringify({ script_id: script_id}),
		headers: {
			'content-type': 'application/json',
			'authorization': `jwt ${jwt}`,
		}
	}));
	const res = await fetch(url, {
		method: 'post',
		body: JSON.stringify({ script_id: script_id}),
		headers: {
			'content-type': 'application/json',
			'authorization': `jwt ${jwt}`,
		}
	});
	const json = await res.json();
	if (!json.success)
		throw `${url} not success` + (json.error ? `, error: ${json.error}` : '');
	return json.response;
};

const querymongo = async data => {
	const url = LKFPOWERVIEWSENGINEMONGOURL;
	const client = await MongoClient.connect(url);

	//console.log('querymongo data', JSON.stringify(data, null, "  "));
	const db = client.db(data.db_name);
	try {
		const res = db.collection(data.collection)[data.command](data.query);
		return await res.toArray();
	} finally {
		client.close();
	}
};

const querycouch = async data => {
	const baseurl = LKFPOWERVIEWSENGINECOUCHURL;
	const cleandb_name = data.db_name.replace(/\s+/g, ''); // XXX hack
	let url = `${baseurl}/${cleandb_name}/${data.command}`;

	//console.log('querycouch url', url, 'data', JSON.stringify(data, null, "  "));
	const res = await fetch(url, {
		method: 'post',
		body: JSON.stringify(data.query),
		headers: { 'content-type': 'application/json' }
	});
	if (!res.ok) {
		console.log('status', res.status);
		console.log('headers', res.headers);
		throw await res.text();
	}
	const json = await res.json();
	if (!json.docs)
		throw 'no docs field in couch response';
	if (!Array.isArray(json.docs))
		throw 'docs field is not array in couch response';
	return json.docs;
};

// gets array of work to do from postgresql
const getpgqueries = async () => {
	const queries = (await db.sequelize.query(`
		-- atomically retrieve and set inqueue state
		update queries
		set	state = 'inqueue'
		where	state = 'unprocessed' or
			state = 'inqueue' or
			(state = 'success' and
				extract(epoch from 'now'::timestamptz)::int >=
				last_refresh + refresh) or
			(state = 'error' and
				extract(epoch from 'now'::timestamptz)::int >=
				last_try + retry) or
			(state = 'working' and
				extract(epoch from 'now'::timestamptz)::int >=
				last_try + retry * 2)
		returning *;
		`,
		{
			model: Query,
			mapToModel: Query,
			logging: (msg, time) => console.log(`${time}ms -- get worklist from postgresql`)
		}
	))
	return queries;
};

const procpgq = async pgq => {
	try {
		pgq.Pguser = await pgq.getPguser();
		pgq.Pguser.Account = await pgq.Pguser.getAccount();
		console.log('working on query.id: %i, query.state: %s, query.script_id: %i:, pguser.name: %s ...', pgq.id, pgq.state, pgq.script_id, pgq.Pguser.name);
		pgq.state = 'working';
		pgq.last_query = await getqueryres(
			(await dologin(pgq.Pguser.Account.email, pgq.Pguser.Account.apikey)),
			pgq.script_id
		);
		await pgq.save(); // store last query in pg db
		let dbdata;
		if (pgq.last_query.type === 'couchdb') {
			dbdata = await querycouch(pgq.last_query);
		} else {
			dbdata = await querymongo(queryclean(pgq.last_query));
		}
		console.log('dbdata response, size: ', JSON.stringify(dbdata).length, 'data: ', trunc_string(JSON.stringify(dbdata)));
		// insert into table in namespace of pguser
		//
		await db.sequelize.transaction(async tx => {
			// fully qualified view name (schema.viewname)
			const fqview = `${pgq.Pguser.name}.${pgq.view}`;
			await db.sequelize.query(
				`set local search_path = "${pgq.Pguser.name}";`,
				{ transaction: tx }
			);
			await db.sequelize.query(
				`truncate "${pgq.table}";`,
				{ transaction: tx }
			);
			if (dbdata.length <= 0)
				return; // only empty tables as asked?

			await db.sequelize.getQueryInterface()
				.bulkInsert(
					pgq.table,
					dbdata.map(x => ({
						data: JSON.stringify(x)
					})),
					{ transaction: tx }
				);

			await db.sequelize.query(
				`drop view if exists "${pgq.view}";`,
				{ transaction: tx }
			);
			await db.sequelize.query(
				`select powerviews_admin.createpview(
					$table::regclass,
					$view,
					$ischema::jsonb,
					$oschema::jsonb
				);`,
				{
					bind: {
						table: pgq.table,
						view: fqview,
						ischema: JSON.stringify((pgq.last_query || {}).input_schema || []),
						oschema: JSON.stringify((pgq.last_query || {}).output_schema || []),
					},
					transaction: tx
				}
			);
			await db.sequelize.query(
				`grant select on "${pgq.view}" to "${pgq.Pguser.name}";`,
				{ transaction: tx }
			);
			// try to get all data from the view to validate
			// the flow fully, so we can catch highlevel
			// runtime errors before our final users catch
			// them
			// XXX this query is specially crafted to be
			// non-optimizable by the different postgresql
			// layers, we don't care about the return value
			// but we need to guarantee full data
			// input/output parsing.
			// Dont waste time/bandwith fetching data we
			// dont care.
			const [ results, metadata ] = await db.sequelize.query(
				`select count(*), sum(length(v::text)) from "${pgq.view}" as v;`,
				{ transaction: tx }
			);
			const { count, sum } = (results || [])[0];
			console.log('count: %s, sum: %s', count, sum);

		})
		if (!dbdata.length)
			throw 'Empty database response, table emptied.'
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
			// with work queue
			pgq.last_error = e.toString();
			pgq.last_try = new Date() / 1000;
			await pgq.save();
		} catch (e) {
			console.log(e);
		}
	}
};

const main = async () => {
	// how many queries process concurrently (not in parallel)
	const concurrency = 100;
	const pgqueries = await getpgqueries();
	//return;
	for (let i = 0; i < pgqueries.length; i += concurrency) {
		const tmp = pgqueries.slice(i, i + concurrency);
		await Promise.all(tmp.map(t => procpgq(t)));
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
