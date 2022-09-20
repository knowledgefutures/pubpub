/* eslint-disable global-require */
const {
	argv: { watch },
} = require('yargs');
const path = require('path');

const watchables = watch && (Array.isArray(watch) ? watch : [watch]).filter((x) => x);

const main = async () => {
	if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
		require(path.join(process.cwd(), 'config.js'));
		const { setupLocalDatabase } = require('./localDatabase');
		await setupLocalDatabase();
	}

	if (process.env.NODE_ENV === 'production') {
		require('newrelic');
	}

	const loadServer = () => {
		return require('./dist/server/server/server').startServer();
	};

	if (watchables) {
		const hotReloadServer = require('./hotReloadServer');
		hotReloadServer(loadServer, watchables);
	} else {
		loadServer();
	}
};

main();
