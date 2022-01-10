import app, { wrap } from 'server/server';
import { ForbiddenError } from 'server/utils/errors';
import { getPub } from 'server/utils/queryHelpers';

import { canCreateSubmission, canUpdateSubmission, canDeleteSubmission } from './permissions';
import { createSubmission, updateSubmission, destroySubmission } from './queries';

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
		const pub = await getPub({ id: newSubmission.pubId });
		return res.status(201).json({ ...newSubmission.toJSON(), pub: { slug: pub.slug } });
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
		const updatedValues = await updateSubmission(req.body, req.user?.id);
		return res.status(201).json(updatedValues);
	}),
);

app.delete(
	'/api/submissions',
	wrap(async (req, res) => {
		const { id } = req.body;
		const canDelete = await canDeleteSubmission({
			userId: req.user?.id,
			id,
		});
		if (!canDelete) {
			throw new ForbiddenError();
		}
		await destroySubmission(req.body, req.user?.id);
		return res.status(200).json(req.body.id);
	}),
);
