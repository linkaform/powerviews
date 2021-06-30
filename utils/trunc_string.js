// truncate long strings for debug messages
module.exports = str => str.length < 1024 ? str : `${str.slice(0, 1024)}...(${str.length - 1024} bytes more)`;
