import { checkMemberPermission } from 'utils/permissions';
import { Collection, ScopeData } from 'types';

export const getUserManagedCollections = (collections: Collection[], scopeData: ScopeData) => {
	const {
		activePermissions: { canManageCommunity },
		memberData,
	} = scopeData;
	if (canManageCommunity) {
		return collections;
	}
	const manageableCollectionIds = new Set(
		memberData
			.filter((m) => checkMemberPermission(m.permissions, 'manage') && m.collectionId)
			.map((m) => m.collectionId) as string[],
	);
	return collections.filter((c) => !c.isRestricted || manageableCollectionIds.has(c.id));
};
