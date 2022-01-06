import app, { wrap } from 'server/server';
import { ForbiddenError } from 'server/utils/errors';

import { canManageSubmissionWorkflow } from './permissions';
import {
	createSubmissionWorkflow,
	updateSubmissionWorkflow,
	destroySubmissionWorkFlow,
} from './queries';

const getRequestIds = (req) => {
	const user = req.user || {};
	return {
		userId: user.id,
		collectionId: req.body.collectionId,
	};
};

app.post(
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

app.put(
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

app.delete(
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
