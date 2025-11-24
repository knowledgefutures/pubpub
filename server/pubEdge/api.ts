import { initServer } from '@ts-rest/express';

import { ForbiddenError, NotFoundError } from 'server/utils/errors';
import { contract } from 'utils/api/contract';

import {
	canApprovePubEdge,
	canApprovePubEdgeWithTargetPubId,
	canCreatePubEdge,
	canUpdateOrDestroyPubEdge,
} from './permissions';
import { createPubEdge, destroyPubEdge, getPubEdgeById, updatePubEdge } from './queries';

const s = initServer();

export const pubEdgeServer = s.router(contract.pubEdge, {
	get: async ({ req }) => {
		const edgeId = req.params.id;
		const edge = await getPubEdgeById(edgeId);

		if (edge) {
			return { status: 200, body: edge };
		}

		throw new NotFoundError();
	},

	// @ts-expect-error FIXME: edge.targetPub.customPublishedAt is Date | null, but "should" be string | null
	// this turns into string | null when it goes through the API, so it's not a problem
	create: async ({ req, body }) => {
		const { pubId, pubIsParent, relationType, targetPubId, externalPublication } = body;
		const userId = req.user.id;
		const [canCreate, approvedByTarget] = await Promise.all([
			canCreatePubEdge({ userId, pubId }),
			canApprovePubEdgeWithTargetPubId({ targetPubId, userId }),
		]);
		if (canCreate) {
			const edge = await createPubEdge({
				pubId,
				targetPubId,
				externalPublication,
				pubIsParent,
				relationType,
				approvedByTarget,
				actorId: userId,
			});

			return { status: 201, body: edge };
		}
		throw new ForbiddenError();
	},

	update: async ({ req, body }) => {
		const {
			pubEdgeId,
			rank,
			pubId,
			pubIsParent,
			relationType,
			targetPubId,
			externalPublication,
		} = body;
		const canUpdateEdge = await canUpdateOrDestroyPubEdge({
			pubEdgeId,
			userId: req.user.id,
		});
		if (canUpdateEdge) {
			const edge = await updatePubEdge({
				pubEdgeId,
				rank,
				pubId,
				pubIsParent,
				relationType,
				targetPubId,
				externalPublication,
			});
			return { status: 200, body: edge };
		}
		throw new ForbiddenError();
	},

	updateApprovedByTarget: async ({ req, body }) => {
		const { pubEdgeId, approvedByTarget } = body;
		const canApproveEdge = await canApprovePubEdge({
			pubEdgeId,
			userId: req.user.id,
		});
		if (canApproveEdge) {
			const edge = await updatePubEdge({
				pubEdgeId,
				approvedByTarget,
			});
			return { status: 200, body: edge };
		}
		throw new ForbiddenError();
	},

	remove: async ({ req, body }) => {
		const { pubEdgeId } = body;
		const userId = req.user.id;
		const canDestroyEdge = await canUpdateOrDestroyPubEdge({
			pubEdgeId,
			userId,
		});
		if (canDestroyEdge) {
			await destroyPubEdge(pubEdgeId, userId);
			return { status: 200, body: {} };
		}
		throw new ForbiddenError();
	},
});
