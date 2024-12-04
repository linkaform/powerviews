'use strict';
const {
	Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
	class Account extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			Account.hasMany(models.Pguser, { foreignKey: { allowNull: false }});
			// Account.hasMany(models.Query, { foreignKey: { allowNull: false }});
		}
	};
	Account.init({
		// used as basis for table name generation
		name: {
			type: DataTypes.STRING(32),
			allowNull: false,
			unique: true,
			validate: {
				notEmpty: true
			}
		},
		email: {
			type: DataTypes.TEXT,
			allowNull: false,
			unique: true,
			// XXX due to other changes email is no longer a email
			// but has username semantics
			//validate: {
			//	isEmail: true
			//}
			validate: {
				notEmpty: true
			}
			// XXX add also proper SQL level constraint
		},
		apikey: {
			type: DataTypes.TEXT,
			allowNull: false,
			validate: {
				notEmpty: true
			}
		},
		desc: {
			type: DataTypes.TEXT
		},

	}, {
		sequelize,
		modelName: 'Account',
	});
	return Account;
};
