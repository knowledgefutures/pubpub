import app, { wrap } from 'server/server';
import { getInitialData } from 'server/utils/initData';
import { getLayoutPubsByBlock } from 'server/utils/layouts';
import { LayoutBlockPubs } from 'utils/layout';

export type RequestIds = {
	alreadyFetchedPubIds?: string[];
	collectionId?: string;
	blocks: LayoutBlockPubs[];
};

app.post(
	'/api/layout',
	wrap(async (req, res) => {
		const { alreadyFetchedPubIds, collectionId, blocks } = req.body as RequestIds;
		const initialData = await getInitialData(req);
		const pubsForLayout = await getLayoutPubsByBlock({
			initialData,
			collectionId,
			alreadyFetchedPubIds,
			blocks,
		});
		return res.status(200).json(pubsForLayout);
	}),
);
