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
			values: ['unprocessed', 'inqueue', 'working', 'error', 'success'],
			defaultValue: 'unprocessed'
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
				min: 60
			}
		},
		retry: {
			type: DataTypes.INTEGER,
			defaultValue: 30,
			allowNull: false,
			validate: {
				min: 1
			}
		},
		last_query: {
			type: DataTypes.JSONB
		},
		last_error: {
			type: DataTypes.TEXT
		},
		last_refresh: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0
		},
		last_try: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0
		},
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
			},
			{
				fields: [ 'state' ]
			}
		],
		hooks: {
			afterSync: async () => { // create complex indexes
				await sequelize.query(
					`create index "queries_last_refresh_refresh_idx" on queries ((last_refresh + refresh) desc);`
				);
				await sequelize.query(
					`create index "queries_last_try_retry_idx" on queries ((last_try + retry) desc);`
				);
				await sequelize.query(
					`alter table queries add constraint "invalid queries.tablename" check (tablename ~ '^[a-zA-Z][a-zA-Z0-9_]+$');`
				);
				await sequelize.query(
					`alter table queries add constraint "invalid queries.viewname" check (viewname ~ '^[a-zA-Z][a-zA-Z0-9_]+$');`
				);
			}
		}
	});
	return Query;
};
