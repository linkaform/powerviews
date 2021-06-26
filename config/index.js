// fetches config of the current environment (development, production, etc)
const env = process.env.NODE_ENV || 'development';
const configf = require('./config.json')[env];
module.exports = configf;
