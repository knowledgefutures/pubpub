import app, { wrap } from 'server/server';
import { ForbiddenError } from 'server/utils/errors';

import { canCreateSubmission, canUpdateSubmission } from './permissions';
import { createSubmission, updateSubmission } from './queries';

app.post(
	'/api/submissions',
	wrap(async (req, res) => {
		const { submissionWorkflowId } = req.body;
		const userId = req.user?.id;
		const canCreate = await canCreateSubmission({
			userId,
			submissionWorkflowId,
		});
		if (!canCreate) {
			throw new ForbiddenError();
		}
		const newSubmission = await createSubmission({ userId, submissionWorkflowId });
		return res.status(201).json(newSubmission);
	}),
);

app.put(
	'/api/submissions',
	wrap(async (req, res) => {
		const { status, id } = req.body;
		const canUpdate = await canUpdateSubmission({
			userId: req.user?.id,
			id,
			status,
		});

		if (!canUpdate) {
			throw new ForbiddenError();
		}

		const updatedValues = await updateSubmission(req.body);
		return res.status(201).json(updatedValues);
	}),
);
