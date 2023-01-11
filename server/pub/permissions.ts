import { Community } from 'server/models';
import { getScope } from 'server/utils/queryHelpers';

import { getValidCollectionIdsFromCreatePubToken } from './tokens';

const managerUpdatableFields = [
	'avatar',
	'customPublishedAt',
	'description',
	'htmlDescription',
	'downloads',
	'labels',
	'slug',
	'title',
	'htmlTitle',
];

const adminUpdatableFields = ['doi'];

export const canCreatePub = async ({ userId, communityId, collectionId, createPubToken }) => {
	if (userId) {
		if (createPubToken) {
			const collectionIds = getValidCollectionIdsFromCreatePubToken(createPubToken, {
				userId,
				communityId,
			});
			if (collectionIds) {
				return { create: true, collectionIds };
			}
			return { create: false };
		}

		const [scopeData, communityData] = await Promise.all([
			getScope({ communityId, collectionId, loginId: userId }),
			Community.findOne({ where: { id: communityId }, attributes: ['hideCreatePubButton'] }),
		]);

		const {
			activePermissions: { canManage },
		} = scopeData;
		const { hideCreatePubButton } = communityData;

		return {
			create: canManage || !hideCreatePubButton,
			collectionIds: [collectionId],
		};
	}
	return { create: false };
};

export const getUpdatablePubFields = async ({ userId, pubId }) => {
	const {
		activePermissions: { canManage, canAdmin },
	} = await getScope({ pubId, loginId: userId });

	if (canManage) {
		if (canAdmin) {
			return [...managerUpdatableFields, ...adminUpdatableFields];
		}
		return managerUpdatableFields;
	}

	return null;
};

export const canDestroyPub = async ({ userId, pubId }) => {
	const {
		activePermissions: { canManage },
	} = await getScope({ pubId, loginId: userId });
	return canManage;
};
