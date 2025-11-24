import type { LayoutBlockPubs } from 'utils/layout';

import { Router } from 'express';

import { getInitialData } from 'server/utils/initData';
import { getLayoutPubsByBlock } from 'server/utils/layouts';
import { wrap } from 'server/wrap';

export const router = Router();

export type RequestIds = {
	alreadyFetchedPubIds?: string[];
	collectionId?: string;
	blocks: LayoutBlockPubs[];
	allowDuplicatePubs: boolean;
};

router.post(
	'/api/layout',
	wrap(async (req, res) => {
		const { alreadyFetchedPubIds, collectionId, blocks, allowDuplicatePubs } =
			req.body as RequestIds;
		const initialData = await getInitialData(req);
		const pubsForLayout = await getLayoutPubsByBlock({
			initialData,
			collectionId,
			alreadyFetchedPubIds,
			blocks,
			allowDuplicatePubs,
		});
		return res.status(200).json(pubsForLayout);
	}),
);
