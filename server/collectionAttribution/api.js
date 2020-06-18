import app, { wrap } from 'server/server';
import { ForbiddenError } from 'server/utils/errors';

import { getPermissions } from './permissions';
import {
	createCollectionAttribution,
	updateCollectionAttribution,
	destroyCollectionAttribution,
} from './queries';

const getRequestIds = (req) => {
	const user = req.user || {};
	return {
		userId: user.id,
		communityId: req.body.communityId,
		collectionId: req.body.collectionId,
		collectionAttributionId: req.body.id,
	};
};

/* Note: we typically use values like collectionAttributionId on API requests */
/* here, id is sent up, so there is a little bit of kludge to make */
/* the other interfaces consistent. I didn't fully understand AttributionEditor */
/* so I didn't make the downstream change, which would be the right solution. */
app.post(
	'/api/collectionAttributions',
	wrap(async (req, res) => {
		const permissions = await getPermissions(getRequestIds(req));
		if (!permissions.create) {
			throw new ForbiddenError();
		}
		const newAttribution = await createCollectionAttribution({
			...req.body,
			collectionAttributionId: req.body.id,
		});
		return res.status(201).json(newAttribution);
	}),
);

app.put(
	'/api/collectionAttributions',
	wrap(async (req, res) => {
		const permissions = await getPermissions(getRequestIds(req));
		if (!permissions.update) {
			throw new ForbiddenError();
		}
		const updatedValues = await updateCollectionAttribution(
			{
				...req.body,
				collectionAttributionId: req.body.id,
			},
			permissions.update,
		);
		return res.status(200).json(updatedValues);
	}),
);

app.delete(
	'/api/collectionAttributions',
	wrap(async (req, res) => {
		const permissions = await getPermissions(getRequestIds(req));
		if (!permissions.destroy) {
			throw new ForbiddenError();
		}
		await destroyCollectionAttribution({
			...req.body,
			collectionAttributionId: req.body.id,
		});
		return res.status(200).json(req.body.id);
	}),
);
