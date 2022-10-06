/* eslint-disable no-console, global-require */
require('ts-node').register({
	transpileOnly: true,
	project: require('path').join(process.cwd(), 'tsconfig.server.json'),
});

const { setupTestDatabase, startTestDatabaseServer, initTestDatabase } = require('../testDatabase');

export default async () => {
	process.env.TZ = 'UTC';
	if (process.env.NODE_ENV !== 'test') {
		throw new Error('Something has gone terribly wrong and I refuse to proceed.');
	}
	if (!process.env.DATABASE_URL) {
		console.log('\nSit tight while a local test database is created...');
		await initTestDatabase();
		global.testDbServerProcess = await startTestDatabaseServer();
		process.env.DATABASE_URL = await setupTestDatabase();
	}
	// eslint-disable-next-line global-require
	const { sequelize } = require('../../server/models');
	await sequelize.sync({ force: false });
};
