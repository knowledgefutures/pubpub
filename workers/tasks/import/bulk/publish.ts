import Bluebird from 'bluebird';

import { Collection } from 'server/models';
import { createRelease } from 'server/release/queries';

import { printImportPlan, getCreatedItemsFromPlan } from './plan';
import { promptOkay } from './prompt';

export const publishBulkImportPlan = async ({ plan, yes, actor, dryRun, createExports }) => {
	printImportPlan(plan, { verb: 'publish' });
	if (dryRun) {
		return;
	}
	await promptOkay('Okay to publish these items?', {
		yes: yes,
		throwIfNo: true,
	});
	const { collections, pubs } = getCreatedItemsFromPlan(plan);
	await Bluebird.map(
		pubs,
		(pub) =>
			createRelease({
				userId: actor.id,
				pubId: pub.id,
				createExports: createExports,
			}).catch((err) => console.error(err)),
		{ concurrency: 25 },
	);
	await Promise.all(
		collections.map((collection) =>
			Collection.update({ isPublic: true }, { where: { id: collection.id } }),
		),
	);
};
