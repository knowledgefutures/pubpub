import { Page } from 'server/models';

import { enrichLayoutBlocksWithPubTokens, getPubsForLayout } from './layout';

export default async ({ query, forLayoutEditor, initialData }) => {
	const pageData = await Page.findOne({
		where: {
			...query,
			communityId: initialData.communityData.id,
		},
	});

	// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ blocks: any; forLayoutEditor: ... Remove this comment to see the full error message
	const pubsData = await getPubsForLayout({
		blocks: pageData.layout || [],
		forLayoutEditor,
		initialData,
	});

	return {
		...pageData.toJSON(),
		// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ blocks: any; initialData: any;... Remove this comment to see the full error message
		layout: enrichLayoutBlocksWithPubTokens({
			blocks: pageData.layout,
			initialData,
		}),
		pubs: pubsData,
	};
};
