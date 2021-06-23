import { Community } from 'server/models';
import { promptOkay } from '../utils/prompt';

import { backfillItemsForCommunity } from './backfillCommunity';

const {
	argv: { community: communitySubdomain },
} = require('yargs');

const main = async () => {
	const community = await Community.findOne({ where: { subdomain: communitySubdomain } });
	if (!community) {
		throw new Error('Community does not exist');
	}
	await promptOkay(`Remove and rebuild ActivityItems for ${community.title}?`, {
		throwIfNo: true,
	});
	await backfillItemsForCommunity(community);
};

main();
