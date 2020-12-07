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
	await Promise.all([
		...pubs.map((pub) =>
			// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ userId: any; pubId: any; creat... Remove this comment to see the full error message
			createRelease({ userId: actor.id, pubId: pub.id, createExports: createExports }),
		),
		...collections.map((collection) =>
			// @ts-expect-error ts-migrate(2339) FIXME: Property 'id' does not exist on type 'never'.
			Collection.update({ isPublic: true }, { where: { id: collection.id } }),
		),
	]);
};
