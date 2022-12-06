import { Community } from 'server/models';
import { addSpamTagToCommunity } from 'server/spamTag/queries';

import { forEachInstance } from '../util';

export const up = async () => {
	await forEachInstance(
		Community,
		async (community) => {
			// eslint-disable-next-line no-console
			console.log('👀', community.title);
			await addSpamTagToCommunity(community.id);
		},
		10,
	);
};
