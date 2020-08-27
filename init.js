/* eslint-disable global-require */
const {
	argv: { watch },
} = require('yargs');
require('@babel/register')({ extensions: ['.js', '.jsx', '.ts', '.tsx'] });

const watchables = watch && (Array.isArray(watch) ? watch : [watch]).filter((x) => x);

if (process.env.NODE_ENV === 'production') {
	require('newrelic');
}

const loadServer = () => {
	return require('./server/server.js').startServer();
};

if (watchables) {
	const hotReloadServer = require('./hotReloadServer');
	hotReloadServer(loadServer, watchables);
} else {
	loadServer();
}
