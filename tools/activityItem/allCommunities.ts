import { Community } from 'server/models';

import { forEach } from '../migrations/util';
import { backfillItemsForCommunity } from './backfillCommunity';

const main = async () => {
	const communities = await Community.findAll();
	await forEach(communities, async (community) => {
		// biome-ignore lint/suspicious/noConsole: shhhhhh
		console.log(community.title);
		await backfillItemsForCommunity(community);
	});
};

main();
