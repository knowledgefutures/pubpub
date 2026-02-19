import type {
	Connection,
	ConnectionManager,
} from 'sequelize/types/dialects/abstract/connection-manager';
import type { Pool } from 'sequelize-pool';

import { knex } from 'knex';
import { ConnectionError, type ConnectionOptions, DataTypes, type PoolOptions } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

/* eslint-enable */
import { abortStorage } from './abort';
import { DatabaseRequestAbortedError } from './utils/errors';

const database_url = process.env.DATABASE_URL;

class SequelizeWithId extends Sequelize {
	/* Create standard id type for our database */
	idType = {
		primaryKey: true,
		type: DataTypes.UUID,
		defaultValue: DataTypes.UUIDV4,
	};

	declare connectionManager: ConnectionManager & {
		pool: { read: Pool<Connection>; write: Pool<Connection> };
	};
}

if (!database_url) {
	console.log('Process.env:', process.env);
	throw new Error('DATABASE_URL environment variable not set');
}

const useSSL = database_url.includes('.');

export const poolOptions = {
	max: process.env.SEQUELIZE_MAX_CONNECTIONS
		? parseInt(process.env.SEQUELIZE_MAX_CONNECTIONS, 10)
		: 20,
	evict: 10_000,
	min: 2,
	idle: process.env.SEQUELIZE_IDLE_TIMEOUT
		? parseInt(process.env.SEQUELIZE_IDLE_TIMEOUT, 10)
		: 60_000,
	acquire: process.env.SEQUELIZE_ACQUIRE_TIMEOUT
		? parseInt(process.env.SEQUELIZE_ACQUIRE_TIMEOUT, 10)
		: 10_000,
	maxUses: process.env.SEQUELIZE_MAX_USES
		? parseInt(process.env.SEQUELIZE_MAX_USES, 10)
		: Infinity,
} satisfies PoolOptions;

// this is to avoid thundering herd
// possibly sequelize is always using the same replica at the beginning

export const sequelize = new SequelizeWithId(database_url, {
	benchmark: true,
	//   logging: (sql, ms) => {
	//     console.log(`[SQL ${ms}ms] ${sql}`)
	//   },
	// benchmark: true,
	// logging: (sql, ms) => {
	// 	console.log(`[SQL ${ms}ms] ${sql}`);
	// },
	// logQueryParameters: true,
	logging: false,

	dialectOptions: { ssl: useSSL ? { rejectUnauthorized: false } : false },
	dialect: 'postgres',
	pool: poolOptions,
	hooks: {
		// IMPORTANT: This is necessary to abort requests that time out, or are prematurely closed by the client
		// helps prevent "deathloop" situations where many requests are happening, Heroku times them out,
		// but we continue processing them and adding extra waiting connections to the pool
		beforePoolAcquire() {
			const store = abortStorage.getStore();
			if (store?.abortController.signal.aborted) {
				throw new DatabaseRequestAbortedError();
			}
		},
	},
	retry: {
		max: 3,
		match: [/Deadlock/i, ConnectionError],
	},
});

export const knexInstance = knex({ client: 'pg' });

/* Change to true to update the model in the database. */
/* NOTE: This being set to true will erase your data. */
if (process.env.NODE_ENV !== 'test') {
	sequelize.sync({ force: false });
}
