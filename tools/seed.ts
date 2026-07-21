import { seedDevData } from 'server/seed';
import { sequelizeSyncPromise } from 'server/sequelize';

async function main() {
	await sequelizeSyncPromise;
	await seedDevData();
	console.log('[seed] Done.');
	process.exit(0);
}

main().catch((err) => {
	console.error('[seed] Failed:', err);
	process.exit(1);
});
