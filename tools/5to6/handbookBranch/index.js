const Module = require('module');

const originalRequire = Module.prototype.require;
Module.prototype.require = function(...args) {
	if (args[0].indexOf('.scss') > -1) {
		return () => {};
	}
	return originalRequire.apply(this, args);
};
require('../../../server/config.js');
require('@babel/register');
require('./process.js');
