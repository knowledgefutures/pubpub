const {
	argv: { watch },
} = require("yargs");

const watchables =
	watch && (Array.isArray(watch) ? watch : [watch]).filter((x) => x);

const main = async () => {
	if (
		process.env.NODE_ENV !== "production" &&
		process.env.NODE_ENV !== "test"
	) {
		const { setupLocalDatabase } = require("./localDatabase");
		await setupLocalDatabase();
	}

	const loadServer = () => {
		return require("./dist/server/server/server").startServer();
	};

	if (watchables) {
		const hotReloadServer = require("./hotReloadServer");
		hotReloadServer(loadServer, watchables);
	} else {
		loadServer();
	}
};

main();
