import { CollectionPub } from 'server/models';
import { getScope } from 'server/utils/queryHelpers';
import { expect } from 'utils/assert';

const canManagePub = async ({
	userId,
	communityId,
	pubId,
}: {
	userId: string;
	communityId: string;
	pubId: string;
}) => {
	const scopeData = await getScope({ loginId: userId, communityId, pubId });
	return (
		scopeData.activePermissions.canManage &&
		scopeData.elements.activePub?.communityId === communityId
	);
};

export const canCreateCollectionPub = async ({ userId, communityId, collectionId, pubId }) => {
	const {
		activePermissions: { canManage },
		elements: {
			activeCollection: { isRestricted },
		},
	} = await getScope({
		communityId,
		collectionId,
		loginId: userId,
	});
	if (canManage) {
		return true;
	}
	if (!isRestricted) {
		return canManagePub({ userId, communityId, pubId });
	}
	return false;
};

export const getUpdatableFieldsForCollectionPub = async ({
	userId,
	communityId,
	collectionPubId,
}: {
	userId: string;
	communityId: string;
	collectionPubId: string;
}) => {
	const { pubId, collectionId } = expect(
		await CollectionPub.findOne({ where: { id: collectionPubId } }),
	);
	const {
		elements: { activeCollection },
		activePermissions,
	} = await getScope({
		communityId,
		collectionId,
		loginId: userId,
	});
	if (activePermissions.canManage) {
		return ['rank', 'pubRank', 'contextHint'];
	}
	const canUpdatePubRank = await canManagePub({
		userId,
		communityId: expect(activeCollection?.communityId),
		pubId,
	});
	if (canUpdatePubRank) {
		return ['pubRank'];
	}
	return null;
};

export const canDestroyCollectionPub = async ({
	userId,
	communityId,
	collectionPubId,
}: {
	userId: string;
	communityId: string;
	collectionPubId: string;
}) => {
	const { collectionId, pubId } = expect(
		await CollectionPub.findOne({ where: { id: collectionPubId } }),
	);
	const {
		activePermissions: { canManage },
		elements: {
			activeCollection: { isRestricted },
		},
	} = await getScope({
		communityId,
		collectionId,
		loginId: userId,
	});
	if (canManage) {
		return true;
	}
	if (!isRestricted) {
		return canManagePub({ userId, communityId, pubId });
	}
	return false;
};
