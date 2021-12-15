import app, { wrap } from 'server/server';
import { ForbiddenError } from 'server/utils/errors';

import { getPermissions } from './permissions';
import { createMember, updateMember, destroyMember } from './queries';

const getRequestIds = (req) => {
	const user = req.user || {};
	const { pubId, collectionId, communityId } = req.body;
	return {
		pubId,
		collectionId,
		communityId,
		actorId: user.id,
	};
};

const chooseTargetFromRequestIds = ({ pubId, collectionId, communityId }) => {
	if (pubId) {
		return { pubId };
	}
	if (collectionId) {
		return { collectionId };
	}
	if (communityId) {
		return { communityId };
	}
	return {};
};

app.post(
	'/api/members',
	wrap(async (req, res) => {
		const { pubId, collectionId, communityId, actorId } = getRequestIds(req);
		const { targetUserId, value } = req.body;
		// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ actorId: any; pubId: any; comm... Remove this comment to see the full error message
		const permissions = await getPermissions({
			actorId,
			pubId,
			communityId,
			collectionId,
			value,
		});
		if (!permissions.create) {
			throw new ForbiddenError();
		}
		const member = await createMember({
			value,
			actorId: req.user.id,
			target: {
				userId: targetUserId,
				...chooseTargetFromRequestIds({
					pubId,
					collectionId,
					communityId,
				}),
			},
		});
		return res.status(201).json(member);
	}),
);

app.put(
	'/api/members',
	wrap(async (req, res) => {
		const { pubId, collectionId, communityId, actorId } = getRequestIds(req);
		const { value, id } = req.body;
		const permissions = await getPermissions({
			actorId,
			pubId,
			communityId,
			collectionId,
			memberId: id,
			value,
		});
		if (!permissions.update) {
			throw new ForbiddenError();
		}
		const member = await updateMember({
			value,
			memberId: id,
			actorId: req.user.id,
		});
		return res.status(200).json(member);
	}),
);

app.delete(
	'/api/members',
	wrap(async (req, res) => {
		const { pubId, collectionId, communityId, actorId } = getRequestIds(req);
		const { value, id } = req.body;
		const permissions = await getPermissions({
			actorId,
			pubId,
			communityId,
			collectionId,
			memberId: id,
			value,
		});
		if (!permissions.destroy) {
			throw new ForbiddenError();
		}
		await destroyMember({ memberId: id, actorId: req.user.id });
		return res.status(200).json(id);
	}),
);
