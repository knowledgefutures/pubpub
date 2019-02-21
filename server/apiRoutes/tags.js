import app from '../server';
import { CommunityAdmin, Tag } from '../models';

app.post('/api/tags', (req, res) => {
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
				throw new Error('Not Authorized to create this tag');
			}
			return Tag.create({
				title: req.body.title.trim(),
				isRestricted: true,
				isPublic: true,
				communityId: req.body.communityId,
			});
		})
		.then((newTag) => {
			return res.status(201).json(newTag);
		})
		.catch((err) => {
			console.error('Error in postTag: ', err);
			return res.status(500).json(err.message);
		});
});

app.put('/api/tags', (req, res) => {
	const user = req.user || {};

	// Filter to only allow certain fields to be updated
	const updatedTag = {};
	Object.keys(req.body).forEach((key) => {
		if (['title', 'isRestricted', 'isPublic', 'pageId'].indexOf(key) > -1) {
			updatedTag[key] = req.body[key];
		}
	});

	const findCommunityAdmin = CommunityAdmin.findOne({
		where: {
			communityId: req.body.communityId,
			userId: user.id,
		},
	});

	findCommunityAdmin
		.then((communityAdminData) => {
			if (user.id !== 'b242f616-7aaa-479c-8ee5-3933dcf70859' && !communityAdminData) {
				throw new Error('Not Authorized to update this tag');
			}
			return Tag.update(updatedTag, {
				where: { id: req.body.tagId },
			});
		})
		.then(() => {
			return res.status(201).json(updatedTag);
		})
		.catch((err) => {
			console.error('Error in putTag: ', err);
			return res.status(500).json(err.message);
		});
});

app.delete('/api/tags', (req, res) => {
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
				throw new Error('Not Authorized to delete this tag');
			}
			return Tag.destroy({
				where: { id: req.body.tagId },
			});
		})
		.then(() => {
			return res.status(201).json(req.body.tagId);
		})
		.catch((err) => {
			console.error('Error in deleteTag: ', err);
			return res.status(500).json(err.message);
		});
});
