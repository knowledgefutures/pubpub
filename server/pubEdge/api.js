import app, { wrap } from 'server/server';
import { ForbiddenError } from 'server/utils/errors';

import {
	canCreatePubEdge,
	canUpdateOrDestroyPubEdge,
	canApprovePubEdge,
	canApprovePubEdgeWithTargetPubId,
} from './permissions';
import { createPubEdge, updatePubEdge, destroyPubEdge } from './queries';

app.post(
	'/api/pubEdges',
	wrap(async (req, res) => {
		const { pubId, pubIsParent, relationType, targetPubId, externalPublication } = req.body;
		const userId = req.user.id;
		const [canCreate, approvedByTarget] = await Promise.all([
			canCreatePubEdge({ userId: userId, pubId: pubId }),
			canApprovePubEdgeWithTargetPubId({ targetPubId: targetPubId, userId: userId }),
		]);
		if (canCreate) {
			const edge = await createPubEdge({
				pubId: pubId,
				targetPubId: targetPubId,
				externalPublication: externalPublication,
				pubIsParent: pubIsParent,
				relationType: relationType,
				approvedByTarget: approvedByTarget,
			});
			return res.status(201).json(edge);
		}
		throw new ForbiddenError();
	}),
);

app.put(
	'/api/pubEdges',
	wrap(async (req, res) => {
		const { pubEdgeId, rank } = req.body;
		const canUpdateEdge = await canUpdateOrDestroyPubEdge({
			pubEdgeId: pubEdgeId,
			userId: req.user.id,
		});
		if (canUpdateEdge) {
			const edge = await updatePubEdge({
				pubEdgeId: pubEdgeId,
				rank: rank,
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
			pubEdgeId: pubEdgeId,
			userId: req.user.id,
		});
		if (canApproveEdge) {
			const edge = await updatePubEdge({
				pubEdgeId: pubEdgeId,
				approvedByTarget: approvedByTarget,
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
		const canDestroyEdge = await canUpdateOrDestroyPubEdge({
			pubEdgeId: pubEdgeId,
			userId: req.user.id,
		});
		if (canDestroyEdge) {
			await destroyPubEdge(pubEdgeId);
			return res.status(200).end();
		}
		throw new ForbiddenError();
	}),
);
