import type {
	Connection,
	ConnectionManager,
} from 'sequelize/types/dialects/abstract/connection-manager';
import type { Pool } from 'sequelize-pool';

import { AsyncLocalStorage } from 'async_hooks';
import { knex } from 'knex';
import { ConnectionError, type ConnectionOptions, DataTypes, type PoolOptions } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

/* eslint-enable */
import { abortStorage } from './abort';
import { env } from './env';
import { DatabaseRequestAbortedError } from './utils/errors';

// cls-hooked-compatible namespace backed by AsyncLocalStorage.
// when enabled via useCLS, sequelize automatically propagates
// transactions to all queries inside sequelize.transaction().
const clsStorage = new AsyncLocalStorage<Map<string, unknown>>();

export const clsNamespace = {
	get(key: string) {
		return clsStorage.getStore()?.get(key);
	},
	set(key: string, value: unknown) {
		clsStorage.getStore()?.set(key, value);
		return value;
	},
	run(callback: (...args: any[]) => any) {
		return clsStorage.run(new Map(), callback);
	},
	bind<T extends (...args: any[]) => any>(fn: T): T {
		const store = clsStorage.getStore();
		if (!store) {
			return fn;
		}
		return ((...args: any[]) => clsStorage.run(store, () => fn(...args))) as T;
	},
};

// biome-ignore lint/correctness/useHookAtTopLevel: not a react hook
Sequelize.useCLS(clsNamespace as any);

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

const database_url = env.DATABASE_URL;

if (!database_url) {
	throw new Error('DATABASE_URL environment variable not set');
}

const useSSL = database_url.includes('.');

export const poolOptions = {
	max: env.SEQUELIZE_MAX_CONNECTIONS ?? 20,
	evict: 10_000,
	min: 2,
	idle: env.SEQUELIZE_IDLE_TIMEOUT ?? 60_000,
	acquire: env.SEQUELIZE_ACQUIRE_TIMEOUT ?? 10_000,
	// Recycle connections after a finite number of uses rather than reusing them
	// forever, so a long-lived socket that has gone stale is retired gracefully.
	maxUses: env.SEQUELIZE_MAX_USES ?? 7500,
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

	dialectOptions: {
		ssl: useSSL ? { rejectUnauthorized: false } : false,
		// helps maybe fix some connection issues w worker
		keepAlive: true,
	},
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
		match: [
			/Deadlock/i,
			ConnectionError,
			/Connection terminated unexpectedly/i,
			/Connection terminated/i,
			/ECONNRESET/,
		],
	},
});

export const knexInstance = knex({ client: 'pg' });

/* Change to true to update the model in the database. */
/* NOTE: This being set to true will erase your data. */
export const sequelizeSyncPromise: Promise<void> =
	process.env.NODE_ENV !== 'test'
		? (async () => {
				// Install pg_trgm extension before sync so the User model's GIN trigram
				// indexes can be created.
				await sequelize.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
				await sequelize.sync({ force: false });

				// Dynamic imports are used here to avoid circular dependencies — these
				// modules import `sequelize` from this file, so a top-level import would
				// create a cycle where one side receives an incomplete module.

				// Install search triggers and backfill tsvector columns
				const {
					installSearchTriggers,
					backfillPubSearchVectors,
					backfillCommunitySearchVectors,
				} = await import('server/search2/searchTriggers');
				await installSearchTriggers();

				// Run backfill in the background so it doesn't block app startup.
				// Only in production — in dev the backfill re-runs on every hot-reload.
				if (process.env.NODE_ENV === 'production') {
					// Serialized (not parallel) because they share an advisory lock.
					(async () => {
						await backfillPubSearchVectors();
						await backfillCommunitySearchVectors();
					})().catch((err) => console.error('Search vector backfill error:', err));
				}

				// Create analytics materialized views (idempotent — no-ops if they exist).
				// Refresh is handled by the nightly cron, not at startup, because it can
				// take several minutes and would delay deploys.
				const { createSummaryViews } = await import('server/analytics/summaryViews');
				await createSummaryViews();

				if (process.env.NODE_ENV !== 'production') {
					const { seedDevData } = await import('server/seed');
					await seedDevData().catch((err) =>
						console.error('[seed] Failed to seed dev data:', err),
					);
				}
			})()
		: Promise.resolve();
