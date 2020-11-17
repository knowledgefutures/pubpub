import { CollectionPub } from 'server/models';
import { getScope } from 'server/utils/queryHelpers';

export const getPermissions = async ({ userId, communityId, collectionId }) => {
	if (!userId) {
		return {};
	}
	const scopeData = await getScope({
		communityId: communityId,
		collectionId: collectionId,
		loginId: userId,
	});
	const isAuthenticated = scopeData.activePermissions.canManage;
	if (!scopeData.elements.activeCollection) {
		return {};
	}
	return {
		create: isAuthenticated,
		update: isAuthenticated ? ['rank', 'contextHint'] : false,
		setPrimary: isAuthenticated,
		destroy: isAuthenticated,
	};
};

const canManagePub = async ({ userId, communityId, pubId }) => {
	const scopeData = await getScope({ loginId: userId, communityId: communityId, pubId: pubId });
	return (
		scopeData.activePermissions.canManage &&
		scopeData.elements.activePub.communityId === communityId
	);
};

export const canCreateCollectionPub = async ({ userId, communityId, collectionId }) => {
	const { activePermissions } = await getScope({
		communityId: communityId,
		collectionId: collectionId,
		loginId: userId,
	});
	return activePermissions.canManage;
};

export const getUpdatableFieldsForCollectionPub = async ({
	userId,
	communityId,
	collectionPubId,
}) => {
	const { pubId, collectionId } = await CollectionPub.findOne({ where: { id: collectionPubId } });
	const {
		elements: { activeCollection },
		activePermissions,
	} = await getScope({
		communityId: communityId,
		collectionId: collectionId,
		loginId: userId,
	});
	if (activePermissions.canManage) {
		return ['rank', 'pubRank', 'contextHint'];
	}
	const canUpdatePubRank = await canManagePub({
		userId: userId,
		communityId: activeCollection.communityId,
		pubId: pubId,
	});
	if (canUpdatePubRank) {
		return ['pubRank'];
	}
	return null;
};

export const canDestroyCollectionPub = async ({ userId, communityId, collectionPubId }) => {
	const { collectionId } = await CollectionPub.findOne({ where: { id: collectionPubId } });
	const { activePermissions } = await getScope({
		communityId: communityId,
		collectionId: collectionId,
		loginId: userId,
	});
	return activePermissions.canManage;
};
