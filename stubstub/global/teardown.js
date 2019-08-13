// (this global is defined next door in setup.js)

export default async () => {
	if (global.testDbServerProcess) {
		global.testDbServerProcess.kill();
	}
};
