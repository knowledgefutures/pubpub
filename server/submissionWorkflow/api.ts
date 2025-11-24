import { Router } from 'express';

import { ForbiddenError } from 'server/utils/errors';
import { wrap } from 'server/wrap';

import { canManageSubmissionWorkflow } from './permissions';
import {
	createSubmissionWorkflow,
	destroySubmissionWorkFlow,
	updateSubmissionWorkflow,
} from './queries';

export const router = Router();

const getRequestIds = (req) => {
	const user = req.user || {};
	return {
		userId: user.id,
		collectionId: req.body.collectionId,
	};
};

router.post(
	'/api/submissionWorkflows',
	wrap(async (req, res) => {
		const requestIds = getRequestIds(req);
		const permissions = await canManageSubmissionWorkflow(requestIds);
		if (!permissions) {
			throw new ForbiddenError();
		}
		const workflow = await createSubmissionWorkflow(req.body);
		return res.status(201).json(workflow);
	}),
);

router.put(
	'/api/submissionWorkflows',
	wrap(async (req, res) => {
		const requestIds = getRequestIds(req);
		const permissions = await canManageSubmissionWorkflow(requestIds);
		if (!permissions) {
			throw new ForbiddenError();
		}
		await updateSubmissionWorkflow(req.body);
		return res.status(200).json({});
	}),
);

router.delete(
	'/api/submissionWorkflows',
	wrap(async (req, res) => {
		const requestIds = getRequestIds(req);
		const permissions = await canManageSubmissionWorkflow(requestIds);
		if (!permissions) {
			throw new ForbiddenError();
		}
		await destroySubmissionWorkFlow(req.body);
		return res.status(200).json(req.body.id);
	}),
);
