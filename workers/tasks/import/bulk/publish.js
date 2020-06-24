import { Collection } from 'server/models';
import { createRelease } from 'server/release/queries';

import { printImportPlan, getCreatedItemsFromPlan } from './plan';
import { promptOkay } from './prompt';

export const publishBulkImportPlan = async ({ plan, yes, actor, dryRun }) => {
	printImportPlan(plan, { verb: 'publish' });
	if (dryRun) {
		return;
	}
	await promptOkay('Okay to publish these items?', {
		yes: yes,
		throwIfNo: true,
	});
	const { collections, pubs } = getCreatedItemsFromPlan(plan);
	await Promise.all([
		...pubs.map((pub) => createRelease({ userId: actor.id, pubId: pub.id })),
		...collections.map((collection) =>
			Collection.update({ isPublic: true }, { where: { id: collection.id } }),
		),
	]);
};
