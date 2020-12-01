/* Since we are running this on server components, we */
/* need to ensure we don't require things intended 	*/
/* for webpack. Namely, .scss files 				*/
const Module = require('module');

const originalRequire = Module.prototype.require;
Module.prototype.require = function(...args) {
	if (args[0].indexOf('.scss') > -1) {
		return () => {};
	}
	return originalRequire.apply(this, args);
};
