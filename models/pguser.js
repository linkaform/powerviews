'use strict';
const {
  Model
} = require('sequelize');
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
			type: DataTypes.TEXT
		}
	}, {
		sequelize,
		modelName: 'Pguser',
	});
	return Pguser;
};
