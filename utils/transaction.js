// helper to create a transaction
const db = require('../models');
// XXX for unknown reasons the following fails:
// 	const { transaction } = db.sequelize;
// 	transaction(...);
// so instead do a full wrapper
module.exports = (...args) => console.log(db) || db.sequelize.transaction(...args);
