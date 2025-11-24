import { Router } from 'express';

import { ForbiddenError, NotFoundError } from 'server/utils/errors';
import { wrap } from 'server/wrap';

import { canModifyLandingPageFeatures } from './permissions';
import { getProposedFeature } from './propose';
import {
	createLandingPageFeature,
	destroyLandingPageFeature,
	updateLandingPageFeature,
} from './queries';

export const router = Router();

router.post(
	'/api/landingPageFeatures',
	wrap(async (req, res) => {
		const { proposal, proposalKind, rank } = req.body;
		const canCreate = await canModifyLandingPageFeatures({ userId: req.user?.id });
		if (!canCreate) {
			throw new ForbiddenError();
		}
		const proposalResult = await getProposedFeature({ proposal, proposalKind });
		if (proposalResult) {
			const newFeature = await createLandingPageFeature({ ...proposalResult, rank });
			return res.status(201).send(newFeature);
		}
		throw new NotFoundError();
	}),
);

router.put(
	'/api/landingPageFeatures',
	wrap(async (req, res) => {
		const {
			landingPageFeature: { id, rank, payload },
		} = req.body;
		const canUpdate = await canModifyLandingPageFeatures({ userId: req.user?.id });
		if (!canUpdate) {
			throw new ForbiddenError();
		}
		await updateLandingPageFeature({ id, rank, payload });
		return res.status(200).send({});
	}),
);

router.delete(
	'/api/landingPageFeatures',
	wrap(async (req, res) => {
		const {
			landingPageFeature: { id },
		} = req.body;
		const canDestroy = await canModifyLandingPageFeatures({ userId: req.user?.id });
		if (!canDestroy) {
			throw new ForbiddenError();
		}
		await destroyLandingPageFeature({ id });
		return res.status(200).send({});
	}),
);
