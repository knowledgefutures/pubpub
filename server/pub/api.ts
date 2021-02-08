import app, { wrap } from 'server/server';
import { ForbiddenError } from 'server/utils/errors';

import { canCreatePub, getUpdatablePubFields, canDestroyPub } from './permissions';
import { createPub, updatePub, destroyPub } from './queries';

const getRequestIds = (req) => {
	const user = req.user || {};
	const { communityId, collectionId, pubId, licenseSlug, createPubToken } = req.body;
	return {
		userId: user.id,
		communityId,
		collectionId,
		createPubToken,
		pubId,
		licenseSlug,
	};
};

app.post(
	'/api/pubs',
	wrap(async (req, res) => {
		const { userId, collectionId, communityId, createPubToken } = getRequestIds(req);
		const { create, collectionIds } = await canCreatePub({
			userId,
			collectionId,
			communityId,
			createPubToken,
		});
		if (create) {
			const newPub = await createPub(
				// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ communityId: any; collectionId... Remove this comment to see the full error message
				{ communityId, collectionIds },
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
			userId,
			pubId,
			licenseSlug,
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
		const canDestroy = await canDestroyPub({ userId, pubId });
		if (canDestroy) {
			await destroyPub(pubId);
			return res.status(200).json({});
		}
		throw new ForbiddenError();
	}),
);
