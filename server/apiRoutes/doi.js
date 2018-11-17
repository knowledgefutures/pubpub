import app from '../server';
import { CommunityAdmin } from '../models';
import { findPub } from '../queryHelpers';
import { getInitialData, submitDoiData } from '../utilities';

app.post('/api/doi', (req, res)=> {
	const user = req.user || {};

	return CommunityAdmin.findOne({
		where: { userId: user.id, communityId: req.body.communityId },
		raw: true,
	})
	.then((communityAdminData)=> {
		if (user.id !== 'b242f616-7aaa-479c-8ee5-3933dcf70859' && !communityAdminData) {
			throw new Error('Not Authorized to update this community');
		}
		return submitDoiData(req.body.pubId, req.body.communityId, true);
	})
	.then(()=> {
		/* After issuing DOI, we need to recalculate citationData to send down */
		return getInitialData(req);
	})
	.then((initialData)=> {
		const pseudoReq = {
			query: { version: req.body.versionId },
			params: { slug: req.body.slug }
		};
		return findPub(pseudoReq, initialData);
	})
	.then((pubData)=> {
		return res.status(201).json({
			doi: pubData.doi,
			citationData: pubData.citationData,
		});
	})
	.catch((err)=> {
		console.error('Error creating DOI', err);
		return res.status(500).json(err);
	});
});
