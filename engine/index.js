const { MongoClient } = require('mongodb');
const fetch = require('node-fetch');
const db = require('../models');

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
	const res = await fetch('https://app.linkaform.com/api/infosync/user_admin/login/', {
		method: 'post',
		body: JSON.stringify(body),
		headers: { 'content-type': 'application/json' }
	});
	const json = await res.json();
	if (!json.success)
		throw 'json not success';
	return json
};

const getqueryres = async (jwt, script_id) => {
	const res = await fetch('https://app.linkaform.com/api/infosync/scripts/run/', {
		method: 'post',
		body: JSON.stringify({ script_id: script_id}),
		headers: { 'content-type': 'application/json' }
	});
	const json = await res.json();
	if (!json.success)
		throw 'json not success';
	return queryclean(json.response);
};

const querymongo = async data => {
	const url = LKFPOWERVIEWSENGINEMONGOURL;
	// try to connect to mongo if connection fail retry indefinitely each
	// 3secs
	const getmongoclient = () => new Promise((res, rej) => {
		MongoClient.connect(url).then(
			client => res(client),
			err => console.log(err) || setTimeout(getmongoclient, 3000)
		)
	});
	const client = await getmongoclient();

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
const getworkdata = async () => {
	const { Query } = db;
	return (await Query.findAll({ include: [{ all: true }]})).map(x => ({ script_id: x.script_id, table: x.table, pgusername: x.Pguser.name}));
};

const main = async () => {
	const work = await getworkdata();
	console.log('work', work);
	for (w of work) {
		const mongodata = await querymongo(await getqueryres((await dologin()).jwt, w.script_id));
		console.log('res size', JSON.stringify(mongodata).length);
		// insert into table in namespace of pguser
		await db.sequelize.transaction(async tx => {
			await db.sequelize.query(
				`set local search_path = "${w.pgusername}";`,
				{ transaction: tx }
			);
			await db.sequelize.getQueryInterface()
				.bulkInsert(
					w.table,
					mongodata.map(x => ({ data: JSON.stringify(x) })),
					{ transaction: tx }
				);
		})
	}
	setTimeout(main, 1000);

};

getconfig();
main()
