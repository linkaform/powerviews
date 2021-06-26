'use strict';
const { api: apiconfig = {} } = require('../config');

const {
  Model
} = require('sequelize');

// receives as argument user and pass, returns connection string in url format,
// returns empty string otherwise
const genconnstr = (user, pass) => {
	const Url = require('url-parse');

	if (!apiconfig.connstr_base)
		return "";
	const url = new Url(apiconfig.connstr_base);
	url.set('username', user);
	url.set('password', pass);
	return url.toString();
}

module.exports = (sequelize, DataTypes) => {
	class Pguser extends Model {
		/**
		* Helper method for defining associations.
		* This method is not a part of Sequelize lifecycle.
		* The `models/index` file will call this method automatically.
		*/
		static associate(models) {
			Pguser.belongsTo(models.Account, {
				foreignKey: { allowNull: false }
			});
			Pguser.hasMany(models.Query, { foreignKey: { allowNull: false }});
		}
	};
	Pguser.init({
		name: {
			type: DataTypes.STRING(64),
			allowNull: false,
			unique: true,
			validate: {
				is: /^pv_.+$/
			}
		},
		pass: {
			type: DataTypes.TEXT,
			allowNull: false,
			validate: {
				is: /^(md5)?.+$/
			}
		},
		desc: {
			type: DataTypes.TEXT
		},
		connstr: {
			type: DataTypes.VIRTUAL(DataTypes.TEXT, ['name', 'pass']),
			get(){
				return genconnstr(this.get('name'), this.get('pass'))
			}
		}
	}, {
		sequelize,
		modelName: 'Pguser',
	});
	return Pguser;
};
