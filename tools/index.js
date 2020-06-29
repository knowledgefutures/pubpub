/* This folder sets up the tools infrastructure */
/* Commands below can be run with: `npm run tools <command_name> */
/* This is additionally helpful because it allows heroku one-off */
/* dynos to be run: `heroku run --size=performance-l "npm run tools <command>"` */

/* eslint-disable global-require */
if (process.env.NODE_ENV !== 'production') {
	require('server/config.js');
}

require('@babel/register');
require('server/utils/serverModuleOverwrite');
require('utils/environment').setEnvironment(process.env.PUBPUB_PRODUCTION, process.env.IS_DUQDUQ);

const command = process.argv[2];
const commandFiles = {
	backfillCheckpoints: './backfillCheckpoints.js',
	branchMaintenance: './branchMaintenance.js',
	bulkimport: '../workers/tasks/import/bulk/cli.js',
	checkpointBackfill: './dashboardMigrations/backfillCheckpoints.js',
	firebaseDownload: './firebaseDownload.js',
	flattenBranchHistory: './flattenBranchHistory.js',
	migrate: './migrate.js',
	migrateDash: './dashboardMigrations/runMigrations.js',
	migration2020_05_06: './migration2020_05_06.js',
	migration2020_06_24: './migration2020_06_24.js',
	migrationsDeprecated: './migrationsDeprecated.js',
	rerunExport: './rerunExport.js',
	searchSync: './searchSync.js',
	switchBranchOrders: './switchBranchOrders.js',
	syncDbSchema: './syncDbSchema.js',
	syncDevFirebase: './syncFirebase.js',
};

const activeCommandFile = commandFiles[command];
if (activeCommandFile) {
	/* eslint-disable-next-line import/no-dynamic-require */
	require(activeCommandFile);
} else {
	console.warn(`Invalid command: "${command}"`);
}

/* Other useful tooling commands: 

- Copy production DB to dev DB (this will overwrite the dev DB)
`heroku pg:copy pubpub-v6-prod::DATABASE_URL DATABASE_URL --app pubpub-v6-dev`

- List running heroku one-off processes
`heroku ps --app pubpub-v6-dev`

- Stop a running heroku one-off processes
`heroku ps:stop 7089 --app pubpub-v6-dev`

*/
