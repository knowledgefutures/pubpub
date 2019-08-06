/* eslint-disable no-console */
import { setupTestDatabase, startTestDatabaseServer, initTestDatabase } from '../testDatabase';

export default async () => {
	if (process.env.NODE_ENV !== 'test') {
		throw new Error('Something has gone terribly wrong and I refuse to proceed.');
	}

	if (!process.env.DATABASE_URL) {
		console.log('\nSit tight while a local test database is created...');
		await initTestDatabase();
		global.testDbServerProcess = startTestDatabaseServer();
		process.env.DATABASE_URL = await setupTestDatabase();
	}
};
