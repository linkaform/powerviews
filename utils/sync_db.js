// destroy tables and reconstruct them again (empty). Will DROP all data and
// all automatically created users.
const db = require('../models');
(async () => {
try {
	// get list of automatically created users
	const [ users, metadata ] = await db.sequelize.query(`
		select	b.rolname
		from	pg_catalog.pg_roles a join
			pg_catalog.pg_auth_members m on
				(a.oid = m.roleid) join
			pg_catalog.pg_roles b on (m.member = b.oid)
		where	a.rolname = 'powerviews_users';`
	);
	for (user of users) {
		// drop user namespace of tables
		await db.sequelize.query(`drop schema "${user.rolname}" cascade;`)
		await db.sequelize.query(`drop role "${user.rolname}";`);
	}
	// drop all tables, then create them
	await db.sequelize.sync({ force: true, hooks: true });
} finally {
	await db.sequelize.close()
}
})();
