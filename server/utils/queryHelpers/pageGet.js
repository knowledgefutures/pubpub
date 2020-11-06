import { Page } from 'server/models';

import { enrichLayoutBlocksWithPubTokens, getPubsForLayout } from './layout';

export default async ({ query, forLayoutEditor, initialData }) => {
	const pageData = await Page.findOne({
		where: {
			...query,
			communityId: initialData.communityData.id,
		},
	});

	const pubsData = await getPubsForLayout({
		blocks: pageData.layout || [],
		forLayoutEditor: forLayoutEditor,
		initialData: initialData,
	});

	return {
		...pageData.toJSON(),
		layout: enrichLayoutBlocksWithPubTokens({
			blocks: pageData.layout,
			initialData: initialData,
		}),
		pubs: pubsData,
	};
};
