/* eslint-disable global-require */
const {
	argv: { watch, refresh },
} = require('yargs');
const throng = require('throng');
require('@babel/register');

const hotReloadServer = require('./hotReloadServer');

const hotReloadArgs = (arg) => arg && (Array.isArray(arg) ? arg : [arg]).filter((x) => x);
const watchables = hotReloadArgs(watch);
const refreshables = hotReloadArgs(refresh);

if (process.env.NODE_ENV === 'production') {
	require('newrelic');
}

throng(
	{
		workers: process.env.WEB_CONCURRENCY || 1,
		lifetime: Infinity,
	},
	() => {
		const startServer = () => {
			return require('./server/server.js')();
		};
		if (watchables) {
			hotReloadServer(startServer, watchables, refreshables);
		} else {
			startServer();
		}
	},
);
