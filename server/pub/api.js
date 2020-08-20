import app, { wrap } from 'server/server';
import { ForbiddenError } from 'server/utils/errors';

import { canCreatePub, getUpdatablePubFields, canDestroyPub } from './permissions';
import { createPub, updatePub, destroyPub } from './queries';

const getRequestIds = (req) => {
	const user = req.user || {};
	const { communityId, collectionId, pubId, licenseSlug } = req.body;
	return {
		userId: user.id,
		communityId: communityId,
		collectionId: collectionId,
		pubId: pubId,
		licenseSlug: licenseSlug,
	};
};

app.post(
	'/api/pubs',
	wrap(async (req, res) => {
		const { userId, collectionId, communityId } = getRequestIds(req);
		const canCreate = await canCreatePub({
			userId: userId,
			collectionId: collectionId,
			communityId: communityId,
		});
		if (canCreate) {
			const newPub = await createPub(
				{ communityId: communityId, collectionId: collectionId },
				userId,
			);
			return res.status(201).json(newPub);
		}
		throw new ForbiddenError();
	}),
);

app.put(
	'/api/pubs',
	wrap(async (req, res) => {
		const { userId, pubId, licenseSlug } = getRequestIds(req);
		const updatableFields = await getUpdatablePubFields({
			userId: userId,
			pubId: pubId,
			licenseSlug: licenseSlug,
		});
		if (updatableFields) {
			const updateResult = await updatePub(req.body, updatableFields);
			return res.status(200).json(updateResult);
		}
		throw new ForbiddenError();
	}),
);
app.delete(
	'/api/pubs',
	wrap(async (req, res) => {
		const { userId, pubId } = getRequestIds(req);
		const canDestroy = await canDestroyPub({ userId: userId, pubId: pubId });
		if (canDestroy) {
			await destroyPub(pubId);
			return res.status(200).json({});
		}
		throw new ForbiddenError();
	}),
);
