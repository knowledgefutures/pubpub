// @ts-check
const path = require('path');

const { createAndRunPostgresDatabase } = require('server/database');
const { isProd } = require('utils/environment');

const setupLocalDatabase = async (definitely) => {
	if (isProd()) {
		throw new Error('Refusing to set up local database in production environment.');
	} else if (definitely || process.env.USE_LOCAL_DB) {
		process.env.DATABASE_URL = await createAndRunPostgresDatabase({
			username: 'pubpubdbadmin',
			password: 'pubpub-db-password',
			dbName: 'pubpub-localdb',
			dbPath: path.join(process.cwd(), 'pubpub-localdb'),
			drop: false,
		});
		process.env.DATABASE_READ_REPLICA_1_URL = process.env.DATABASE_URL;
		process.env.DATABASE_READ_REPLICA_2_URL = process.env.DATABASE_URL;
	}
};

module.exports = { setupLocalDatabase };
