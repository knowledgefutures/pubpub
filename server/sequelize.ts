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
const database_read_replica_1_url = process.env.DATABASE_READ_REPLICA_1_URL;
const database_read_replica_2_url = process.env.DATABASE_READ_REPLICA_2_URL;

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
	throw new Error('DATABASE_URL environment variable not set');
}
if (!database_read_replica_1_url) {
	throw new Error('DATABASE_READ_REPLICA_1_CONNECTION_POOL_URL environment variable not set');
}
if (!database_read_replica_2_url) {
	throw new Error('DATABASE_READ_REPLICA_2_CONNECTION_POOL_URL environment variable not set');
}

const useSSL = database_url.indexOf('localhost') === -1;

const parseDBUrl = (url: string): ConnectionOptions => {
	const parsed = new URL(url);
	return {
		host: parsed.hostname,
		username: parsed.username,
		password: parsed.password,
		port: parsed.port,
		database: parsed.pathname.slice(1),
	};
};

export const poolOptions = {
	max: process.env.SEQUELIZE_MAX_CONNECTIONS
		? parseInt(process.env.SEQUELIZE_MAX_CONNECTIONS, 10)
		: 5,
	evict: 10_000,
	min: 0,
	idle: process.env.SEQUELIZE_IDLE_TIMEOUT
		? parseInt(process.env.SEQUELIZE_IDLE_TIMEOUT, 10)
		: 10_000,
	acquire: process.env.SEQUELIZE_ACQUIRE_TIMEOUT
		? parseInt(process.env.SEQUELIZE_ACQUIRE_TIMEOUT, 10)
		: 15_000,
	maxUses: process.env.SEQUELIZE_MAX_USES
		? parseInt(process.env.SEQUELIZE_MAX_USES, 10)
		: Infinity,
} satisfies PoolOptions;

// this is to avoid thundering herd
// possibly sequelize is always using the same replica at the beginning
const shouldUse1First = Math.random() < 0.5;
const readReplicas = shouldUse1First
	? [parseDBUrl(database_read_replica_1_url), parseDBUrl(database_read_replica_2_url)]
	: [parseDBUrl(database_read_replica_2_url), parseDBUrl(database_read_replica_1_url)];

export const sequelize = new SequelizeWithId(database_url, {
	logging: false,
	dialectOptions: { ssl: useSSL ? { rejectUnauthorized: false } : false },
	dialect: 'postgres',
	replication: {
		read: readReplicas,
		write: parseDBUrl(database_url),
	},
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

// pool loggin in dev
if (process.env.NODE_ENV === 'development' && process.env.LOG_POOL_STATS === 'true') {
	// clear any existing pool monitor interval before creating a new one
	if ((global as any).poolMonitorInterval) {
		console.log('clearing existing pool monitor interval');
		clearInterval((global as any).poolMonitorInterval);
	}

	(global as any).poolMonitorInterval = setInterval(() => {
		console.log('pool', {
			size: sequelize.connectionManager.pool.read.size,
			available: sequelize.connectionManager.pool.read.available,
			using: sequelize.connectionManager.pool.read.using,
			waiting: sequelize.connectionManager.pool.read.waiting,
		});
	}, 1_000);
}

export const knexInstance = knex({ client: 'pg' });

/* Change to true to update the model in the database. */
/* NOTE: This being set to true will erase your data. */
if (process.env.NODE_ENV !== 'test') {
	sequelize.sync({ force: false });
}
