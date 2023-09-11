import { Community } from 'server/models';
import { getScope } from 'server/utils/queryHelpers';

import { expect } from 'utils/assert';
import { CanCreatePub } from 'types';
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
] as const;

const adminUpdatableFields = ['doi'] as const;

export const canCreatePub = async ({
	userId,
	communityId,
	collectionId,
	createPubToken,
}: CanCreatePub) => {
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
		const { hideCreatePubButton } = expect(communityData);

		return {
			create: canManage || !hideCreatePubButton,
			collectionIds: [collectionId],
		};
	}
	return { create: false };
};

export const getUpdatablePubFields = async ({
	userId,
	pubId,
}: {
	userId?: string | null;
	pubId: string;
}) => {
	const {
		activePermissions: { canManage, canAdmin },
	} = await getScope({ pubId, loginId: userId });

	if (canManage) {
		if (canAdmin) {
			return [...managerUpdatableFields, ...adminUpdatableFields] as [
				...typeof managerUpdatableFields,
				...typeof adminUpdatableFields,
			];
		}
		return managerUpdatableFields;
	}

	return null;
};

export type PubUpdateableFields = Awaited<ReturnType<typeof getUpdatablePubFields>>;

export const canDestroyPub = async ({
	userId,
	pubId,
}: {
	userId?: string | null;
	pubId: string;
}) => {
	const {
		activePermissions: { canManage },
	} = await getScope({ pubId, loginId: userId });
	return canManage;
};

export const canDepositPub = async ({ userId, pubId }: { userId: string; pubId: string }) => {
	const {
		activePermissions: { canManage },
	} = await getScope({ pubId, loginId: userId });
	return canManage;
};
