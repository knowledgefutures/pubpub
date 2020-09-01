const Module = require('module');

const originalRequire = Module.prototype.require;
Module.prototype.require = function(...args) {
	if (args[0].indexOf('.scss') > -1) {
		return () => {};
	}
	return originalRequire.apply(this, args);
};
require('../../../server/config');
require('@babel/register');
require('./process.js');
