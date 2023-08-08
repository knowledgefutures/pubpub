import { Pub } from 'server/models';
import { getScope } from 'server/utils/queryHelpers';

export const getPermissions = async ({ userId, pubId, communityId }, accessHash) => {
	if (!userId || !pubId) {
		return {};
	}

	const pub = await Pub.findOne({ where: { id: pubId } });
	const hasAccessHash = pub?.reviewHash === accessHash;
	const scopeData = await getScope({
		communityId,
		pubId,
		loginId: userId,
	});

	if (!scopeData.elements.activePub) {
		return {};
	}

	const { canAdmin, canCreateReviews, canManage } = scopeData.activePermissions;

	let editProps = [];
	if (canManage) {
		// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
		editProps = ['title', 'status', 'labels', 'releaseRequested'];
	}

	return {
		create: canCreateReviews || hasAccessHash,
		createRelease: canAdmin,
		update: editProps,
		destroy: canManage,
	};
};
