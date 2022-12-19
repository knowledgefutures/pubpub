/* This folder sets up the tools infrastructure */
/* Commands below can be run with: `npm run tools <command_name> */
/* This is additionally helpful because it allows heroku one-off */
/* dynos to be run: `heroku run --size=performance-l "npm run tools <command>"` */

/* eslint-disable global-require */
if (process.env.NODE_ENV !== 'production') {
	require('../config');
}

require('server/utils/serverModuleOverwrite');
require('utils/environment').setEnvironment(
	process.env.PUBPUB_PRODUCTION,
	process.env.IS_DUQDUQ,
	process.env.IS_QUBQUB,
);
require('server/hooks');

const command = process.argv[2];
const commandFiles = {
	backfillActivity: './activityItem/allCommunities',
	backfillCommunityActivity: './activityItem/singleCommunityCli',
	backfillCheckpoints: './backfillCheckpoints',
	backfillDepositTargets: './backfillDepositTargets',
	backup: './backup/backup',
	branchMaintenance: './branchMaintenance',
	bulkimport: '../workers/tasks/import/bulk/cli',
	checkpointBackfill: './dashboardMigrations/backfillCheckpoints',
	clone: './clone',
	devshell: './devshell',
	depositCollectionPubs: './depositCollectionPubs',
	emailActivityDigest: './emailActivityDigest',
	emailUsers: './emailUsers',
	encrypt: './encrypt',
	exportCollection: './exportCollection',
	figurelist: './figurelist',
	firebaseDownload: './firebaseDownload',
	flattenBranchHistory: './flattenBranchHistory',
	layoutcheck: './layoutcheck/check',
	migrate: './migrate',
	migrateDash: './dashboardMigrations/runMigrations',
	migration2020_05_06: './migration2020_05_06',
	migration2020_06_24: './migration2020_06_24',
	migrationsDeprecated: './migrationsDeprecated',
	movePubs: './movePubs',
	pubCrawl: './pubCrawl',
	rerankCollections: './rerankCollections',
	rerunExport: './rerunExport',
	searchSync: './searchSync',
	switchBranchOrders: './switchBranchOrders',
	syncDbSchema: './syncDbSchema',
	syncDevFirebase: './syncFirebase',
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
