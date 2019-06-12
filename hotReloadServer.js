const chokidar = require('chokidar');
const debounce = require('debounce');
const path = require('path');

const fromRoot = (relPath) => path.join(process.cwd(), relPath);

const cleanModuleCache = (watchablePaths) => {
	Object.keys(require.cache).forEach((id) => {
		// If the module is found within one of the paths we're watching,
		// we remove it from the cache.
		if (watchablePaths.some((wp) => id.startsWith(wp))) {
			delete require.cache[id];
		}
	});
};

module.exports = (startServer, watchablePathsRelative) => {
	const watchablePaths = watchablePathsRelative.map(fromRoot);
	const state = {
		server: startServer(),
		sockets: [],
	};

	// eslint-disable-next-line no-console
	console.log(
		`Server is watching these paths for hot reloading: ${watchablePathsRelative.join(', ')}`,
	);

	const restart = debounce(() => {
		cleanModuleCache(watchablePaths);
		state.sockets.forEach((socket) => {
			if (socket.destroyed === false) {
				socket.destroy();
			}
		});
		state.sockets = [];
		state.server.close(() => {
			// eslint-disable-next-line no-console
			state.server = startServer();
		});
	}, 250);

	chokidar.watch(watchablePaths, { awaitWriteFinish: true }).on('all', (evt, file) => {
		if (evt === 'change') {
			if (['.js', '.jsx', '.ts', '.tsx'].some((ext) => file.endsWith(ext))) {
				restart();
			}
		}
	});

	state.server.on('connection', (socket) => {
		state.sockets.push(socket);
	});
};
