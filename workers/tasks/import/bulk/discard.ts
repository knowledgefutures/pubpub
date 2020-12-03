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
	// @ts-expect-error ts-migrate(2339) FIXME: Property 'id' does not exist on type 'never'.
	await Promise.all(pubs.map((pub) => Pub.destroy({ where: { id: pub.id } })));
	await Promise.all(
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'id' does not exist on type 'never'.
		collections.map((collection) => Collection.destroy({ where: { id: collection.id } })),
	);
	await Promise.all(
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'id' does not exist on type 'never'.
		communities.map((community) => Community.destroy({ where: { id: community.id } })),
	);
};
