// destroy database and reconstruct it again (empty). Will DELETE all data.
const db = require('../models');
(async () => {
try {
	await db.sequelize.sync({ force: true });
} finally {
	await db.sequelize.close()
}
})();
