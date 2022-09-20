import { Config } from './types';
import { createPostgresHelper } from './postgres';

export const createAndRunPostgresDatabase = async (config: Config) => {
	const { drop } = config;
	const helper = await createPostgresHelper(config);
	const exists = await helper.dbExists();
	if (drop) {
		await helper.dropDbAndUser();
	}
	if (drop || !exists) {
		await helper.setupDbAndUser();
	}
	helper.startDbServer();
	return helper.getDatabaseUrl();
};
