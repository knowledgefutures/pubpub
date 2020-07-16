import { PubEdge } from 'server/models';
import { getPubEdgeIncludes } from 'server/utils/queryHelpers/pubEdgeOptions';
import { createExternalPublication } from 'server/externalPublication/queries';
import { findRankInRankedList } from 'utils/rank';

const findRankForNewPubEdge = async (pubId, moveToTop) => {
	const otherEdgesFromPub = await PubEdge.findAll({ where: { pubId: pubId } });
	return findRankInRankedList(otherEdgesFromPub, moveToTop ? 0 : otherEdgesFromPub.length);
};

const getExternalPublicationId = async (maybeAttrs) => {
	if (maybeAttrs) {
		const externalPublication = await createExternalPublication(maybeAttrs);
		return externalPublication.id;
	}
	return null;
};

export const createPubEdge = async ({
	pubId,
	relationType,
	pubIsParent,
	externalPublication = null,
	targetPubId = null,
	approvedByTarget = false,
	moveToTop = true,
}) => {
	const [externalPublicationId, rank] = await Promise.all([
		getExternalPublicationId(externalPublication),
		findRankForNewPubEdge(pubId, moveToTop),
	]);
	const newEdge = await PubEdge.create({
		pubId: pubId,
		rank: rank,
		relationType: relationType,
		pubIsParent: pubIsParent,
		targetPubId: targetPubId,
		approvedByTarget: approvedByTarget,
		externalPublicationId: externalPublicationId,
	});
	return PubEdge.findOne({
		where: { id: newEdge.id },
		include: getPubEdgeIncludes({ includeTargetPub: true }),
	});
};

export const updatePubEdge = async ({ pubEdgeId, ...update }) => {
	const edge = await PubEdge.findOne({ where: { id: pubEdgeId } });
	await edge.update(update);
	return edge;
};

export const destroyPubEdge = async (pubEdgeId) => {
	return PubEdge.destroy({ where: { id: pubEdgeId } });
};
