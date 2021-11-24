import Bluebird from 'bluebird';

import { Collection } from 'server/models';
import { createRelease } from 'server/release/queries';
import { summarizeCollection, summarizeCommunity } from 'server/scopeSummary';

import { printImportPlan, getCreatedItemsFromPlan } from './plan';
import { promptOkay } from './prompt';

export const publishBulkImportPlan = async ({ plan, yes, actor, dryRun, createExports }) => {
	printImportPlan(plan, { verb: 'publish' });
	if (dryRun) {
		return;
	}
	await promptOkay('Okay to publish these items?', {
		yes,
		throwIfNo: true,
	});
	const { collections, pubs } = getCreatedItemsFromPlan(plan);
	await Bluebird.map(
		pubs,
		(pub) =>
			createRelease({
				userId: actor.id,
				pubId: pub.id,
				createExports,
			}).catch((err) => console.error(err)),
		{ concurrency: 1 },
	);
	await Promise.all(
		collections.map(async (collection) => {
			await Collection.update({ isPublic: true }, { where: { id: collection.id } });
			await summarizeCollection(collection.id);
		}),
	);
	const communityIds = [...new Set([...collections, ...pubs].map((item) => item.communityId))];
	await Promise.all(communityIds.map((communityId) => summarizeCommunity(communityId)));
};
