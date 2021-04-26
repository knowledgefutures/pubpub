import { Community, Collection, Pub } from 'server/models';
import { summarizeCollection, summarizeCommunity, summarizePub } from 'server/scopeSummary/queries';

import { forEachInstance } from '../util';

export const up = async () => {
	await forEachInstance(Pub, (pub) => summarizePub(pub.id, false), 25);
	await forEachInstance(Collection, (collection) => summarizeCollection(collection.id), 25);
	await forEachInstance(Community, (community) => summarizeCommunity(community.id, 25));
};
