import app from '../server';
import { CommunityAdmin, Tag, PubTag } from '../models';

app.post('/api/pubTags', (req, res) => {
	const user = req.user || {};

	const findCommunityAdmin = CommunityAdmin.findOne({
		where: {
			communityId: req.body.communityId,
			userId: user.id,
		},
	});

	findCommunityAdmin
		.then((communityAdminData) => {
			if (user.id !== 'b242f616-7aaa-479c-8ee5-3933dcf70859' && !communityAdminData) {
				throw new Error('Not Authorized to create this pub tag');
			}
			/* If the tag is being created from the pub, create the Tag first */
			if (!req.body.tagId && req.body.title) {
				return Tag.create({
					title: req.body.title.trim(),
					isRestricted: true,
					isPublic: true,
					communityId: req.body.communityId,
				});
			}
			return undefined;
		})
		.then((newTag) => {
			return PubTag.create({
				pubId: req.body.pubId,
				tagId: req.body.tagId || newTag.id,
			});
		})
		.then((newPubTag) => {
			return PubTag.findOne({
				where: { id: newPubTag.id },
				include: [{ model: Tag, as: 'tag' }],
			});
		})
		.then((newPubTagData) => {
			return res.status(201).json(newPubTagData);
		})
		.catch((err) => {
			console.error('Error in postTag: ', err);
			return res.status(500).json(err.message);
		});
});

app.delete('/api/pubTags', (req, res) => {
	const user = req.user || {};

	const findCommunityAdmin = CommunityAdmin.findOne({
		where: {
			communityId: req.body.communityId,
			userId: user.id,
		},
	});

	findCommunityAdmin
		.then((communityAdminData) => {
			if (user.id !== 'b242f616-7aaa-479c-8ee5-3933dcf70859' && !communityAdminData) {
				throw new Error('Not Authorized to delete this pubTag');
			}
			return PubTag.destroy({
				where: { id: req.body.pubTagId },
			});
		})
		.then(() => {
			return res.status(201).json(req.body.pubTagId);
		})
		.catch((err) => {
			console.error('Error in deletePubTag: ', err);
			return res.status(500).json(err.message);
		});
});
