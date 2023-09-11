import { ExternalPublication, Pub, PubEdge } from 'server/models';
import { getPubEdgeIncludes } from 'server/utils/queryHelpers/pubEdgeOptions';
import { createExternalPublication } from 'server/externalPublication/queries';
import { findRankInRankedList } from 'utils/rank';
import { expect } from 'utils/assert';
import * as types from 'types';
import { RelationTypeName } from 'utils/pubEdge/relations';
import { CreationAttributes } from 'sequelize';

const findRankForNewPubEdge = async (pubId: string, moveToTop: boolean) => {
	const otherEdgesFromPub = await PubEdge.findAll({ where: { pubId } });
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
	actorId = null,
}: {
	pubId: string;
	relationType: RelationTypeName;
	pubIsParent: boolean;
	externalPublication?: CreationAttributes<ExternalPublication> | null;
	targetPubId?: string | null;
	approvedByTarget?: boolean;
	moveToTop?: boolean;
	actorId?: string | null;
}) => {
	const [externalPublicationId, rank] = await Promise.all([
		getExternalPublicationId(externalPublication),
		findRankForNewPubEdge(pubId, moveToTop),
	]);
	const newEdge = await PubEdge.create(
		{
			pubId,
			rank,
			relationType,
			pubIsParent,
			targetPubId,
			approvedByTarget,
			externalPublicationId,
		},
		{ actorId },
	);
	return PubEdge.findOne({
		where: { id: newEdge.id },
		include: getPubEdgeIncludes({ includeTargetPub: true }),
	}) as Promise<
		types.DefinitelyHas<PubEdge, 'externalPublication'> & {
			targetPub: types.DefinitelyHas<Pub, 'collectionPubs' | 'releases' | 'attributions'>;
		}
	>;
};

export const getPubEdgeById = (pubEdgeId: string) => {
	return PubEdge.findByPk(pubEdgeId, {
		include: getPubEdgeIncludes({ includeTargetPub: true }),
	});
};

export const updatePubEdge = async ({ pubEdgeId, ...update }) => {
	const edge = expect(
		await PubEdge.findOne({
			where: { id: pubEdgeId },
			include: getPubEdgeIncludes({ includeTargetPub: true }),
		}),
	);
	if (edge.externalPublication && update.externalPublication) {
		await edge.externalPublication.update(update.externalPublication);
	}
	await edge.update(update);
	return edge;
};

export const destroyPubEdge = async (pubEdgeId: string, actorId: string | null = null) => {
	return PubEdge.destroy({ where: { id: pubEdgeId }, actorId, individualHooks: true });
};
