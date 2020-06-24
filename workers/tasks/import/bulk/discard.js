import { Pub, Community, Collection } from 'server/models';

import { printImportPlan, getCreatedItemsFromPlan } from './plan';
import { promptOkay } from './prompt';

export const discardBulkImportPlan = async ({ plan, yes, dryRun }) => {
	printImportPlan(plan, { verb: 'delete' });
	if (dryRun) {
		return;
	}
	await promptOkay('Okay to delete these items?', {
		yes: yes,
		yesIsDefault: false,
		throwIfNo: true,
	});
	const { communities, collections, pubs } = getCreatedItemsFromPlan(plan);
	await Promise.all(pubs.map((pub) => Pub.destroy({ where: { id: pub.id } })));
	await Promise.all(
		collections.map((collection) => Collection.destroy({ where: { id: collection.id } })),
	);
	await Promise.all(
		communities.map((community) => Community.destroy({ where: { id: community.id } })),
	);
};
