import app, { wrap } from 'server/server';
import { ForbiddenError } from 'server/utils/errors';

import { canCreatePub, getUpdatablePubFields, canDestroyPub } from './permissions';
import { createPub, updatePub, destroyPub } from './queries';

const getRequestIds = (req) => {
	const user = req.user || {};
	const { communityId, collectionId, pubId, licenseSlug, createPubToken } = req.body;
	return {
		userId: user.id,
		communityId: communityId,
		collectionId: collectionId,
		createPubToken: createPubToken,
		pubId: pubId,
		licenseSlug: licenseSlug,
	};
};

app.post(
	'/api/pubs',
	wrap(async (req, res) => {
		const { userId, collectionId, communityId, createPubToken } = getRequestIds(req);
		const { create, collectionIds } = await canCreatePub({
			userId: userId,
			collectionId: collectionId,
			communityId: communityId,
			createPubToken: createPubToken,
		});
		if (create) {
			const newPub = await createPub(
				{ communityId: communityId, collectionIds: collectionIds },
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
