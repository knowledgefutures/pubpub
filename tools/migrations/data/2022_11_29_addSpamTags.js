import { Community } from 'server/models';
import { addSpamTagToCommunity } from 'server/spamTag/queries';

import { forEachInstance } from '../util';

export const up = async () => {
	await forEachInstance(
		Community,
		async (community) => {
			// biome-ignore lint/suspicious/noConsole: shhhhhh
			console.log('👀', community.title);
			await addSpamTagToCommunity(community.id);
		},
		10,
	);
};
