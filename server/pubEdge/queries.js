import { PubEdge } from 'server/models';
import { createExternalPublication } from 'server/externalPublication/queries';
import findRank from 'utils/findRank';

const findRankForNewPubEdge = async (pubId, moveToTop) => {
	const otherEdgesFromPub = await PubEdge.findAll({ where: { pubId: pubId } });
	const ranks = otherEdgesFromPub.map((edge) => edge.rank);
	return findRank(ranks, moveToTop ? 0 : ranks.length);
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
	moveToTop = false,
}) => {
	const [externalPublicationId, rank] = await Promise.all([
		getExternalPublicationId(externalPublication),
		findRankForNewPubEdge(pubId, moveToTop),
	]);
	return PubEdge.create({
		pubId: pubId,
		rank: rank,
		relationType: relationType,
		pubIsParent: pubIsParent,
		targetPubId: targetPubId,
		approvedByTarget: approvedByTarget,
		externalPublicationId: externalPublicationId,
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
