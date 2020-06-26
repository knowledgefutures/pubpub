/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
/* eslint-disable no-console */
import fs from 'fs-extra';
import path from 'path';
import { Sequelize } from 'sequelize';

import { isProd } from 'utils/environment';
import { sequelize } from 'server/models';
import * as models from 'server/models';

import { promptOkay } from './utils/prompt';

const {
	argv: { name },
} = require('yargs');

const findMigrationPath = async () => {
	const pathToMigration = path.join(__dirname, 'migrations', name + '.js');
	const stat = await fs.stat(pathToMigration);
	if (stat.isFile()) {
		return './' + path.relative(__dirname, pathToMigration);
	}
	throw new Error(`Cannot find migration by name ${name}`);
};

const getDatabaseName = () => {
	return isProd() ? 'prod' : 'dev';
};

const main = async () => {
	const migrationPath = await findMigrationPath();
	await promptOkay(`Run migration at ${migrationPath} on ${getDatabaseName()}?`, {
		throwIfNo: true,
		yesIsDefault: false,
	});
	const migrationFn = require(migrationPath);
	console.info('Starting migration');
	await migrationFn({ Sequelize: Sequelize, sequelize: sequelize, models: models });
};

main().then(() => {
	console.info('Migration complete');
	process.exit(0);
});
