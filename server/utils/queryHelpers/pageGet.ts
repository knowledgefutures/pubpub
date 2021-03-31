import { Page } from 'server/models';

import { enrichLayoutBlocksWithPubTokens, getLayoutPubsByBlock } from 'server/utils/layouts';

export default async ({ query, initialData }) => {
	const pageData = await Page.findOne({
		where: {
			...query,
			communityId: initialData.communityData.id,
		},
	});

	const layoutPubsByBlock = await getLayoutPubsByBlock({
		blocks: pageData.layout || [],
		initialData,
	});

	return {
		...pageData.toJSON(),
		layout: enrichLayoutBlocksWithPubTokens({
			blocks: pageData.layout,
			initialData,
		} as any),
		layoutPubsByBlock,
	};
};
