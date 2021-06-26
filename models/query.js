'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
	class Query extends Model {
		/**
		* Helper method for defining associations.
		* This method is not a part of Sequelize lifecycle.
		* The `models/index` file will call this method automatically.
		*/
		static associate(models) {
			Query.belongsTo(models.Pguser, { foreignKey: { allowNull: false }});
		}
	};
	// XXX sync with api
	Query.init({
		script_id: {
			type: DataTypes.INTEGER,
			field: 'script_id',
			allowNull: false
		},
		table: {
			type: DataTypes.STRING,
			field: 'tablename',
			allowNull: false,
			defaultValue: sequelize.fn('format', 'tbl%s', sequelize.fn('currval', 'queries_id_seq'))
		},
		created: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW
		},
		state: {
			type: DataTypes.ENUM,
			values: ['active', 'pending', 'error'],
			defaultValue: 'pending'
		},
		view: {
			type: DataTypes.STRING(64),
			field: 'viewname',
			allowNull: false,
			defaultValue: sequelize.fn('format', 'vw%s', sequelize.fn('currval', 'queries_id_seq'))
		},
		refresh: {
			type: DataTypes.INTEGER,
			defaultValue: 300,
			allowNull: false,
			validate: {
				min: 10
			}
		},
		query: {
			type: DataTypes.JSONB
		}
	}, {
		sequelize,
		modelName: 'Query',
		indexes: [
			// script_id must not repeat by pguser_id
			{
				unique: true,
				fields: [ 'script_id', 'pguser_id' ]
			},
			// viewname must not repeat by pguser_id
			{
				unique: true,
				fields: [ 'viewname', 'pguser_id' ]
			},
			// tablename must not repeat by pguser_id
			{
				unique: true,
				fields: [ 'tablename', 'pguser_id' ]
			}
		]
	});
	return Query;
};
