import type { InitialData } from 'types';

import { Page } from 'server/models';
import { enrichLayoutBlocksWithPubTokens, getLayoutPubsByBlock } from 'server/utils/layouts';

import { createLogger } from './communityGet';

export default async function pageGet({
	query,
	initialData,
}: {
	query: any;
	initialData: InitialData;
}) {
	const { end, log } = createLogger('getPage');
	const pageData = await log(
		'page',
		Page.findOne({
			where: {
				...query,
				communityId: initialData.communityData.id,
			},
		}),
	);

	const layoutPubsByBlock = await log(
		'getLayoutBlock',
		getLayoutPubsByBlock({
			allowDuplicatePubs: pageData?.layoutAllowsDuplicatePubs!,
			blocks: pageData?.layout || [],
			initialData,
		}),
	);

	const layout = await log(
		'enrichBlocks',
		new Promise<void>((resolve) => {
			const output = enrichLayoutBlocksWithPubTokens({
				blocks: pageData?.layout,
				initialData,
			} as any);

			resolve(output);
		}),
	);
	end();
	return {
		...pageData?.toJSON(),
		layout: layout,
		layoutPubsByBlock,
	};
}
