import { Pub } from 'server/models';
import { getScope } from 'server/utils/queryHelpers';

export const updatePermissions = ['title', 'status', 'labels', 'releaseRequested'] as const;

export const getPermissions = async ({
	userId,
	communityId,
	pubId,
	reviewAccessHash,
}: {
	userId: string;
	communityId: string;
	pubId: string;
	reviewAccessHash: string;
}) => {
	if (!communityId || !pubId) {
		return {};
	}

	const pub = await Pub.findOne({ where: { id: pubId } });
	const hasAccessHash = pub?.reviewHash === reviewAccessHash;

	const scopeData = await getScope({
		communityId,
		pubId,
		loginId: userId,
	});

	if (!scopeData.elements.activePub) {
		return {};
	}
	const { canAdmin, canCreateReviews, canManage } = scopeData.activePermissions;

	return {
		create: canCreateReviews || hasAccessHash,
		createRelease: canAdmin,
		update: canManage && updatePermissions,
		destroy: canManage,
	};
};

export type ReviewPermissions = {
	create?: boolean;
	createRelease?: boolean;
	update?: false | typeof updatePermissions;
	destroy?: boolean;
};
