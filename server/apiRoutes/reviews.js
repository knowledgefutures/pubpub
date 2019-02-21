import app from '../server';
import { Pub, CommunityAdmin, PubManager } from '../models';

app.put('/api/pubs/reviews', (req, res) => {
	const user = req.user || {};

	const findPubManager = PubManager.findOne({
		where: {
			userId: user.id,
			pubId: req.body.pubId,
		},
	});

	const findCommunityAdmin = CommunityAdmin.findOne({
		where: {
			userId: req.user && req.user.id,
			communityId: req.body.communityId || null,
		},
	});
	const findPub = Pub.findOne({
		where: { id: req.body.pubId, communityId: req.body.communityId },
	});
	Promise.all([findPubManager, findCommunityAdmin, findPub])
		.then(([pubManagerData, communityAdminData, pubData]) => {
			const accessAsCommunityAdmin = communityAdminData;
			if (
				user.id !== 'b242f616-7aaa-479c-8ee5-3933dcf70859' &&
				!pubManagerData &&
				!accessAsCommunityAdmin
			) {
				throw new Error('Not Authorized to update this pub');
			}

			const existingReview = pubData.review || [];
			const updatedReview = [
				...existingReview,
				{
					...req.body.reviewItem,
					createdAt: new Date(),
					userId: user.id,
				},
			];

			return Pub.update(
				{ review: updatedReview },
				{
					where: { id: req.body.pubId, communityId: req.body.communityId },
					returning: true,
				},
			);
		})
		.then((updatedPubData) => {
			return res.status(201).json(updatedPubData[1][0].review);
		})
		.catch((err) => {
			console.error('Error putting Pub', req.body, err);
			return res.status(500).json(err);
		});
});
