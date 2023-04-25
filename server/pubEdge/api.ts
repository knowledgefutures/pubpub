import app, { wrap } from 'server/server';
import { ForbiddenError, NotFoundError } from 'server/utils/errors';

import {
	canCreatePubEdge,
	canUpdateOrDestroyPubEdge,
	canApprovePubEdge,
	canApprovePubEdgeWithTargetPubId,
} from './permissions';
import { createPubEdge, updatePubEdge, destroyPubEdge, getPubEdgeById } from './queries';

app.get(
	'/api/pubEdges/:id',
	wrap(async (req, res) => {
		const edgeId = req.params.id;
		const edge = await getPubEdgeById(edgeId);

		if (edge) {
			res.status(200).json(edge);
		} else {
			throw new NotFoundError();
		}
	}),
);

app.post(
	'/api/pubEdges',
	wrap(async (req, res) => {
		const { pubId, pubIsParent, relationType, targetPubId, externalPublication } = req.body;
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
			return res.status(201).json(edge);
		}
		throw new ForbiddenError();
	}),
);

app.put(
	'/api/pubEdges',
	wrap(async (req, res) => {
		const {
			pubEdgeId,
			rank,
			pubId,
			pubIsParent,
			relationType,
			targetPubId,
			externalPublication,
		} = req.body;
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
			return res.status(200).json(edge);
		}
		throw new ForbiddenError();
	}),
);

app.put(
	'/api/pubEdges/approvedByTarget',
	wrap(async (req, res) => {
		const { pubEdgeId, approvedByTarget } = req.body;
		const canApproveEdge = await canApprovePubEdge({
			pubEdgeId,
			userId: req.user.id,
		});
		if (canApproveEdge) {
			const edge = await updatePubEdge({
				pubEdgeId,
				approvedByTarget,
			});
			return res.status(200).json(edge);
		}
		throw new ForbiddenError();
	}),
);

app.delete(
	'/api/pubEdges',
	wrap(async (req, res) => {
		const { pubEdgeId } = req.body;
		const userId = req.user.id;
		const canDestroyEdge = await canUpdateOrDestroyPubEdge({
			pubEdgeId,
			userId,
		});
		if (canDestroyEdge) {
			await destroyPubEdge(pubEdgeId, userId);
			return res.status(200).json({});
		}
		throw new ForbiddenError();
	}),
);
