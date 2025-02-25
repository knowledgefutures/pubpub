import { DataTypes, ConnectionError, ConnectionOptions } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { knex } from 'knex';

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
}

if (!database_url) {
	throw new Error('DATABASE_URL environment variable not set');
}
if (!database_read_replica_1_url) {
	throw new Error('DATABASE_READ_REPLICA_1_URL environment variable not set');
}
if (!database_read_replica_2_url) {
	throw new Error('DATABASE_READ_REPLICA_2_URL environment variable not set');
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

export const sequelize = new SequelizeWithId(database_url, {
	logging: false,
	dialectOptions: { ssl: useSSL ? { rejectUnauthorized: false } : false },
	dialect: 'postgres',
	replication: {
		read: [parseDBUrl(database_read_replica_1_url), parseDBUrl(database_read_replica_2_url)],
		write: parseDBUrl(database_url),
	},
	pool: {
		max: process.env.SEQUELIZE_MAX_CONNECTIONS
			? parseInt(process.env.SEQUELIZE_MAX_CONNECTIONS, 10)
			: 5, // Some migrations require this number to be 150
		// Time after which idle connections are released.
		idle: process.env.SEQUELIZE_IDLE ? parseInt(process.env.SEQUELIZE_IDLE, 10) : 10_000,
		// Maximum time to wait when acquiring a connection, after which an error
		// will be thrown.
		acquire: process.env.SEQUELIZE_ACQUIRE
			? parseInt(process.env.SEQUELIZE_ACQUIRE, 10)
			: 15_000,
		// Maximum number of uses before a connection is released. Helps evenly
		// distribute connections across dynos during peak load.
		maxUses: process.env.SEQUELIZE_MAX_USES
			? parseInt(process.env.SEQUELIZE_MAX_USES, 10)
			: 1_000,
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
