/* eslint-disable no-console, global-require */

import { ChildProcessWithoutNullStreams } from 'child_process';
import { setupTestDatabase, startTestDatabaseServer, initTestDatabase } from '../testDatabase';

// HACK(ian): The PUBPUB_SYNCING_MODELS_FOR_TEST_DB flag tells the code that we're only going to use
// it to sync Sequelize to a test database, and that it's safe to skip certain operations.
// In practice, we do this for the stupidest possible reason: because I can't figure out how to
// get any modules required() from here to acknowledge absolute import paths like "server/utils"
// instead of "../../server/utils". Since we use this absolute style extensively, we have to
// carefully limit what we require from here. Luckily, all we need is server/models.ts, and
// the handful of utilities that it must import.
//
// This is absurd, but it works. If you know how to fix this, please do!

// So we can set `global.testDbServerProcess` below
declare namespace global {
	let testDbServerProcess: ChildProcessWithoutNullStreams | undefined;
}

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

	// see hack comment above
	process.env.PUBPUB_SYNCING_MODELS_FOR_TEST_DB = 'true';
	/**
	 * Two things of note
	 * 1. Dynamic import inline instead of top-level import in order to set
	 * process.env.DATABASE_URL as in above
	 * 2. Imported from '../../server/models' instead of '../../server/sequelize' to
	 * guarantee that all models are imported
	 *
	 * If 2 is not done, then the models will not be imported and the
	 * sequelize.sync() will not create the tables in the test db,
	 * leading to "relation does not exist" errors when running tests
	 */
	const { sequelize } = await import('../../server/models');
	await sequelize.sync();

	/**
	 * This is here because the tests in `server/routes` rely on the
	 * `customScripts` feature flag being present in the database.
	 *
	 * If this is not here, then the tests will fail.
	 */
	const { FeatureFlag } = await import('../../server/models');

	await FeatureFlag.create({
		name: 'customScripts',
	});

	delete process.env.PUBPUB_SYNCING_MODELS_FOR_TEST_DB;

	// close this connection to the database after setup properly clean up the connection
	await sequelize.close();
};
