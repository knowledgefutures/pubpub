import { getScope } from 'server/utils/queryHelpers';
import { PubEdge } from 'server/models';
import { expect } from 'utils/assert';

export const canManagePubEdges = (scope) => scope.activePermissions.canManage;

export const canCreatePubEdge = async ({ pubId, userId }) => {
	const scope = await getScope({ pubId, loginId: userId });
	return canManagePubEdges(scope);
};

export const canUpdateOrDestroyPubEdge = async ({ pubEdgeId, userId }) => {
	const edge = expect(await PubEdge.findOne({ where: { id: pubEdgeId } }));
	const scope = await getScope({ pubId: edge.pubId, loginId: userId });
	return canManagePubEdges(scope);
};

export const canApprovePubEdgeWithTargetPubId = async ({
	targetPubId,
	userId,
}: {
	targetPubId?: string | null;
	userId: string;
}) => {
	if (targetPubId) {
		const scope = await getScope({ pubId: targetPubId, loginId: userId });
		return canManagePubEdges(scope);
	}
	return false;
};

export const canApprovePubEdge = async ({
	pubEdgeId,
	userId,
}: {
	pubEdgeId: string;
	userId: string;
}) => {
	const { targetPubId } = expect(await PubEdge.findOne({ where: { id: pubEdgeId } }));
	return canApprovePubEdgeWithTargetPubId({ targetPubId: expect(targetPubId), userId });
};
