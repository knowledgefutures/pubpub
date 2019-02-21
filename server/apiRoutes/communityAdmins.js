import app from '../server';
import { CommunityAdmin, User } from '../models';
import { subscribeUser } from '../mailchimpHelpers';

app.post('/api/communityAdmins', (req, res) => {
	const user = req.user || {};

	CommunityAdmin.findOne({
		where: { communityId: req.body.communityId, userId: user.id },
		raw: true,
	})
		.then((communityAdminData) => {
			if (user.id !== 'b242f616-7aaa-479c-8ee5-3933dcf70859' && !communityAdminData) {
				throw new Error('Not Authorized to edit this community');
			}
			return CommunityAdmin.create({
				userId: req.body.userId,
				communityId: req.body.communityId,
			});
		})
		.then((newAdmin) => {
			return User.findOne({
				where: { id: newAdmin.userId },
				attributes: ['id', 'slug', 'fullName', 'initials', 'avatar', 'email'],
			});
		})
		.then((newAdminData) => {
			subscribeUser(newAdminData.email, '2847d5271c', ['Community Admins']);
			const adminDataJson = newAdminData.toJSON();
			delete adminDataJson.email;
			return res.status(201).json(adminDataJson);
		})
		.catch((err) => {
			console.error('Error in postCommunityAdmin: ', err);
			return res.status(500).json(err.message);
		});
});

app.delete('/api/communityAdmins', (req, res) => {
	const user = req.user || {};

	CommunityAdmin.findOne({
		where: { communityId: req.body.communityId, userId: user.id },
		raw: true,
	})
		.then((communityAdminData) => {
			if (user.id !== 'b242f616-7aaa-479c-8ee5-3933dcf70859' && !communityAdminData) {
				throw new Error('Not Authorized to edit this community');
			}
			return CommunityAdmin.destroy({
				where: { communityId: req.body.communityId, userId: req.body.userId },
			});
		})
		.then(() => {
			return res.status(201).json('success');
		})
		.catch((err) => {
			console.error('Error in deleteCommunityAdmin: ', err);
			return res.status(500).json(err.message);
		});
});
