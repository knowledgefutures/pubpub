import type { InitialData } from 'types';

import { Page } from 'server/models';
import { enrichLayoutBlocksWithPubTokens, getLayoutPubsByBlock } from 'server/utils/layouts';

export default async ({ query, initialData }: { query: any; initialData: InitialData }) => {
	const pageData = await Page.findOne({
		where: {
			...query,
			communityId: initialData.communityData.id,
		},
	});

	const layoutPubsByBlock = await getLayoutPubsByBlock({
		allowDuplicatePubs: pageData?.layoutAllowsDuplicatePubs!,
		blocks: pageData?.layout || [],
		initialData,
	});

	return {
		...pageData?.toJSON(),
		layout: enrichLayoutBlocksWithPubTokens({
			blocks: pageData?.layout,
			initialData,
		} as any),
		layoutPubsByBlock,
	};
};
