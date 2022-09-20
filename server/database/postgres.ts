import fs from 'fs';
import path from 'path';
import hasbin from 'hasbin';
import * as child_process from 'child_process';

import { Config, PostgresHelper } from './types';

const requiredBinaries = ['createdb', 'dropuser', 'dropdb', 'pg_ctl', 'psql'];

const blockForFile = (filename, timeout = 100) =>
	new Promise<void>((resolve) => {
		const check = () => {
			if (fs.existsSync(filename)) {
				resolve();
			} else {
				setTimeout(check, timeout);
			}
		};
		check();
	});

const throwBinariesWarning = () => {
	console.warn(
		'This script relies on these Postgres utilities to work: ' +
			requiredBinaries.join(', ') +
			". If you're using a Mac you might try 'brew install postgres'.",
	);
	throw new Error('Missing some binaries to handle test database');
};

export const createPostgresHelper = async (config: Config): Promise<PostgresHelper> => {
	const { dbPath, dbName, username, password } = config;

	const env = {
		...process.env,
		PGDATA: dbPath,
	};

	const log = (message: string) => {
		// eslint-disable-next-line no-console
		console.log(`[${dbName}] ${message}`);
	};

	const getDatabaseUrl = () => {
		return `postgres://${username}:${password}@localhost:5432/${dbName}`;
	};

	const execute = (command: string) => {
		return new Promise<any>((resolve, reject) =>
			child_process.exec(command, { env }, (err, res) => {
				if (err) {
					return reject(err);
				}
				return resolve(res);
			}),
		);
	};

	const spawn = (command: string, args: string[] = []) => {
		return child_process.spawn(command, args, { env });
	};

	const dbExists = async () => {
		const dbListingRaw = (await execute('psql -lt')).toString();
		const dbNames = dbListingRaw.split('\n').map((rawRow) => {
			const entries = rawRow.split('|').map((entry) => entry.trim());
			return entries[0];
		});
		return dbNames.includes(dbName);
	};

	const dropDbAndUser = async () => {
		log(`Dropping database and admin user...`);
		await execute(`dropdb --if-exists ${dbName}`);
		await execute(`dropuser --if-exists ${username}`);
	};

	const setupDbAndUser = async () => {
		log(`Creating database and admin user...`);
		await execute(`psql postgres -c "CREATE USER ${username} WITH PASSWORD '${password}';"`);
		await execute(`createdb ${dbName} --no-password --owner ${username}`);
	};

	const startDbServer = () => {
		log(`Starting database server at ${getDatabaseUrl()}`);
		spawn('pg_ctl', ['start', '-w']);
	};

	if (!hasbin.all.sync(requiredBinaries)) {
		throwBinariesWarning();
	}
	if (!fs.existsSync(dbPath)) {
		log(`Initializing database at ${dbPath} for the first time...`);
		await execute('initdb');
	}
	await blockForFile(path.join(dbPath, 'global/pg_filenode.map'));

	return { dropDbAndUser, setupDbAndUser, startDbServer, getDatabaseUrl, dbExists };
};
