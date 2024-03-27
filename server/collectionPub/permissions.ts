import { CollectionPub } from 'server/models';
import { getScope } from 'server/utils/queryHelpers';
import { expect } from 'utils/assert';

const canManagePub = async ({
	userId,
	communityId,
	pubId,
}: {
	userId?: string | null;
	communityId: string;
	pubId: string;
}) => {
	const scopeData = await getScope({ loginId: userId, communityId, pubId });
	return (
		scopeData.activePermissions.canManage &&
		scopeData.elements.activePub?.communityId === communityId
	);
};

export const canCreateCollectionPub = async ({
	userId,
	communityId,
	collectionId,
	pubId,
}: {
	userId?: string | null;
	communityId: string;
	collectionId: string;
	pubId: string;
}) => {
	const {
		activePermissions: { canManage },
		elements: { activeCollection },
	} = await getScope({
		communityId,
		collectionId,
		loginId: userId,
	});

	const isRestricted = activeCollection?.isRestricted;

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
	userId?: string | null;
	communityId: string;
	collectionPubId: string;
}) => {
	if (!userId) {
		return null;
	}
	const collectionPub = await CollectionPub.findOne({ where: { id: collectionPubId } });
	if (!collectionPub) {
		// we pretend the user doesn't have permission to update the collectionPub
		return null;
	}

	const { pubId, collectionId } = collectionPub;

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
	userId?: string | null;
	communityId: string;
	collectionPubId: string;
}) => {
	if (!userId) {
		return false;
	}
	const collectionPub = await CollectionPub.findOne({ where: { id: collectionPubId } });
	if (!collectionPub) {
		// we pretend the user doesn't have permission to delete the collectionPub
		return null;
	}

	const { pubId, collectionId } = collectionPub;

	const {
		activePermissions: { canManage },
		elements: { activeCollection },
	} = await getScope({
		communityId,
		collectionId,
		loginId: userId,
	});

	const isRestricted = activeCollection?.isRestricted;

	if (canManage) {
		return true;
	}
	if (!isRestricted) {
		return canManagePub({ userId, communityId, pubId });
	}
	return false;
};
