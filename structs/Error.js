const default_messages = {
	ENOENT: 'no such entry'
};

module.exports = class {
	constructor(code, message) {
		this.error_code = code;
		this.error_message = message || default_messages[code] || null;
	}
}
