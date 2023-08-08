import { Page } from 'server/models';

import { enrichLayoutBlocksWithPubTokens, getLayoutPubsByBlock } from 'server/utils/layouts';
import { InitialData } from 'types';
import { expect } from 'utils/assert';

export default async ({ query, initialData }: { query: any; initialData: InitialData }) => {
	const pageData = expect(
		await Page.findOne({
			where: {
				...query,
				communityId: initialData.communityData.id,
			},
		}),
	);

	const layoutPubsByBlock = await getLayoutPubsByBlock({
		allowDuplicatePubs: pageData.layoutAllowsDuplicatePubs,
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
