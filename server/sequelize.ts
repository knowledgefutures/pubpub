import { DataTypes, ConnectionError } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { knex } from 'knex';

const database_url = process.env.DATABASE_URL;

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

const useSSL = database_url.indexOf('localhost') === -1;

const poolOptions = process.env.WORKER
	? {
			max: process.env.WORKERS_SEQUELIZE_MAX_CONNECTIONS
				? parseInt(process.env.WORKERS_SEQUELIZE_MAX_CONNECTIONS, 10)
				: 2,
			min: 0,
			idle: 0,
			acquire: 10000,
	  }
	: {
			max: process.env.SEQUELIZE_MAX_CONNECTIONS
				? parseInt(process.env.SEQUELIZE_MAX_CONNECTIONS, 10)
				: 5, // Some migrations require this number to be 150
			min: 0,
			idle: 10000,
			acquire: 60000,
	  };

export const sequelize = new SequelizeWithId(database_url, {
	logging: false,
	dialectOptions: { ssl: useSSL ? { rejectUnauthorized: false } : false },
	pool: poolOptions,
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
