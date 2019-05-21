import app from '../server';
import { getPermissions } from './permissions';
import { createSubmission, acceptSubmission, updateSubmission, destroySubmission } from './queries';

const getRequestIds = (req) => {
	const user = req.user || {};
	return {
		userId: user.id,
		communityId: req.body.communityId,
		pubId: req.body.pubId,
		submissionId: req.body.submissionId || null,
		sourceBranchId: req.body.sourceBranchId || null,
		destinationBranchId: req.body.destinationBranchId || null,
	};
};

app.post('/api/submissions', (req, res) => {
	const requestIds = getRequestIds(req);
	getPermissions(requestIds)
		.then((permissions) => {
			if (!permissions.create) {
				throw new Error('Not Authorized');
			}
			return createSubmission(req.body);
		})
		.then((newSubmission) => {
			return res.status(201).json(newSubmission);
		})
		.catch((err) => {
			console.error('Error in postSubmission: ', err);
			return res.status(500).json(err.message);
		});
});

app.post('/api/submissions/accept', (req, res) => {
	const requestIds = getRequestIds(req);
	getPermissions(requestIds)
		.then((permissions) => {
			if (!permissions.accept) {
				throw new Error('Not Authorized');
			}
			return acceptSubmission(req.body);
		})
		.then(() => {
			return res.status(201).json(req.body.submissionId);
		})
		.catch((err) => {
			console.error('Error in postSubmission: ', err);
			return res.status(500).json(err.message);
		});
});

app.put('/api/submissions', (req, res) => {
	getPermissions(getRequestIds(req))
		.then((permissions) => {
			if (!permissions.update) {
				throw new Error('Not Authorized');
			}
			return updateSubmission(req.body, permissions.update);
		})
		.then((updatedSubmissionValues) => {
			return res.status(201).json(updatedSubmissionValues);
		})
		.catch((err) => {
			console.error('Error in putSubmission: ', err);
			return res.status(500).json(err.message);
		});
});

app.delete('/api/submissions', (req, res) => {
	getPermissions(getRequestIds(req))
		.then((permissions) => {
			if (!permissions.destroy) {
				throw new Error('Not Authorized');
			}
			return destroySubmission(req.body);
		})
		.then(() => {
			return res.status(201).json(req.body.submissionId);
		})
		.catch((err) => {
			console.error('Error in deleteSubmission: ', err);
			return res.status(500).json(err.message);
		});
});
