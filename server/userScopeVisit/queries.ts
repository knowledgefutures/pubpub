import { UserScopeVisit } from 'server/models';

type UserScopeVisitIds = {
	userId?: null | string;
	pubId?: string;
	collectionId?: string;
	communityId: string;
};

export const createUserScopeVisit = async (userScopeVisitIds: UserScopeVisitIds) => {
	const { userId, pubId, collectionId, communityId } = userScopeVisitIds;
	if (!userId) {
		return;
	}
	await UserScopeVisit.upsert({
		userId,
		pubId,
		collectionId,
		communityId,
	});
};

export const getUserScopeVisits = ({ userId, communityId }) => {
	if (!userId) {
		return [];
	}
	return UserScopeVisit.findAll({
		where: { userId, communityId },
		order: [['updatedAt', 'DESC']],
		limit: 10,
	});
};
