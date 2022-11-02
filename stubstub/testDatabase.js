import { exec as execWithCallback, spawn } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import hasbin from 'hasbin';

const requiredBinaries = ['createdb', 'dropuser', 'dropdb', 'pg_ctl', 'psql'];

const pgDataPath = path.join(process.cwd(), 'pubpub-postgres-test');

const testDbConfig = {
	username: 'testuser',
	password: 'testpwd',
	name: 'pubpub-testdb',
};

const exec = (command) =>
	new Promise((resolve, reject) =>
		execWithCallback(
			command,
			{
				env: {
					...process.env,
					PGDATA: pgDataPath,
				},
			},
			(err, res) => {
				if (err) {
					return reject(err);
				}
				return resolve(res);
			},
		),
	);

const createDbUrl = ({ name, username, password }) => {
	return `postgres://${username}:${password}@localhost:5432/${name}`;
};

const throwBinariesWarning = () => {
	console.warn(
		'This script relies on these Postgres utilities to work: ' +
			requiredBinaries.join(', ') +
			". If you're using a Mac you might try 'brew install postgres'.",
	);
	throw new Error('Missing some binaries to handle test database');
};

const blockForFile = (filename, timeout = 100) =>
	new Promise((resolve) => {
		const check = () => {
			if (fs.existsSync(filename)) {
				resolve();
			} else {
				setTimeout(check, timeout);
			}
		};
		check();
	});

export const initTestDatabase = async () => {
	if (!fs.existsSync(pgDataPath)) {
		await exec('initdb');
	}
};

export const setupTestDatabase = async (config = testDbConfig) => {
	if (!hasbin.all.sync(requiredBinaries)) {
		throwBinariesWarning();
	}
	await blockForFile(path.join(pgDataPath, 'global/pg_filenode.map'));
	await exec(`dropdb --if-exists ${config.name}`);
	await exec(`dropuser --if-exists ${config.username}`);
	await exec(
		`psql postgres -c "CREATE USER ${config.username} WITH PASSWORD '${config.password}';"`,
	);
	await exec(`createdb ${config.name} --no-password --owner ${config.username}`);
	return createDbUrl(config);
};

export const startTestDatabaseServer = async () => {
	if (!hasbin.all.sync(requiredBinaries)) {
		throwBinariesWarning();
	}
	const child = spawn('pg_ctl', ['start', '-w'], {
		env: {
			...process.env,
			PGDATA: pgDataPath,
		},
	});
	child.on('error', (err) => console.error(err));
	return child;
};
