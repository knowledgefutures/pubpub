import { ForbiddenError } from 'server/utils/errors';

import { createGetRequestIds } from 'utils/getRequestIds';
import { contract } from 'utils/api/contract';
import { initServer } from '@ts-rest/express';
import { getPermissions } from './permissions';
import { createMember, updateMember, destroyMember } from './queries';

const getRequestIds = createGetRequestIds<{
	communityId?: string;
	pubId?: string | null;
	collectionId?: string | null;
}>();

const chooseTargetFromRequestIds = ({
	pubId,
	collectionId,
	communityId,
}: {
	pubId?: string | null;
	collectionId?: string | null;
	communityId?: string;
}) => {
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

const s = initServer();

export const memberServer = s.router(contract.member, {
	create: async ({ req, body }) => {
		const { pubId, collectionId, communityId, userId: actorId } = getRequestIds(body, req.user);
		const { targetUserId, value } = body;
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
		return { status: 201, body: member };
	},

	update: async ({ req, body }) => {
		const { pubId, collectionId, communityId, userId: actorId } = getRequestIds(body, req.user);
		const { value, id: memberId } = body;
		const permissions = await getPermissions({
			actorId,
			pubId,
			communityId,
			collectionId,
			memberId,
			value,
		});
		if (!permissions.update) {
			throw new ForbiddenError();
		}
		const member = await updateMember({
			value,
			memberId,
			actorId: req.user.id,
		});
		return { status: 200, body: member };
	},

	remove: async ({ req, body }) => {
		const { pubId, collectionId, communityId, userId: actorId } = getRequestIds(body, req.user);
		const { id } = body;
		const permissions = await getPermissions({
			actorId,
			pubId,
			communityId,
			collectionId,
			memberId: id,
		});
		if (!permissions.destroy) {
			throw new ForbiddenError();
		}
		await destroyMember({ memberId: id, actorId: req.user.id });
		return { status: 200, body: id };
	},
});
