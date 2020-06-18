const Module = require('module');

/* Since we are server-rendering components, we 	*/
/* need to ensure we don't require things intended 	*/
/* for webpack. Namely, .scss files 				*/
const originalRequire = Module.prototype.require;
Module.prototype.require = function(...args) {
	if (args[0].indexOf('.scss') > -1) {
		return () => {};
	}
	return originalRequire.apply(this, args);
};

require('@babel/register');

const { setEnvironment, setAppCommit } = require('utils/environment');

setEnvironment(process.env.PUBPUB_PRODUCTION, process.env.IS_DUQDUQ);
setAppCommit(process.env.HEROKU_SLUG_COMMIT);
