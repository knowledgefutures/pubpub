import app from 'server/server';
import { hostIsValid } from 'server/utils/routes';
import { ForbiddenError, handleErrors } from 'server/utils/errors';
import { canCreateSubmission } from 'server/submission/permissions';
import { createSubmission } from 'server/submission/queries';
import { getPub } from 'server/utils/queryHelpers';

app.get(['/submit/:submissionWorkflowId'], async (req, res, next) => {
	try {
		if (!hostIsValid(req, 'community')) {
			return next();
		}
		if (req.user) {
			const { id: userId } = req.user;
			const { submissionWorkflowId } = req.params;
			if (await canCreateSubmission({ userId, submissionWorkflowId })) {
				const submission = await createSubmission({ userId, submissionWorkflowId });
				const pub = await getPub({ id: submission.pubId });
				return res.redirect(`/pub/${pub.slug}`);
			}
			throw new ForbiddenError();
		}
		const params = new URLSearchParams({ redirect: req.url }).toString();
		return res.redirect(`/login?${params}`);
	} catch (err) {
		return handleErrors(req, res, next);
	}
});
