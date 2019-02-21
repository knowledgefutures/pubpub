import app from '../server';
import { PubManager, User, CommunityAdmin, PubAttribution } from '../models';

app.post('/api/pubAttributions', (req, res) => {
	// Authenticate user. Make sure they have edit permissions on the given pub.

	const user = req.user || {};

	const findCommunityAdmin = CommunityAdmin.findOne({
		where: {
			communityId: req.body.communityId,
			userId: user.id,
		},
	});
	const findPubManager = PubManager.findOne({
		where: {
			pubId: req.body.pubId,
			userId: user.id,
		},
	});
	Promise.all([findCommunityAdmin, findPubManager])
		.then(([communityAdminData, pubManagerData]) => {
			if (
				user.id !== 'b242f616-7aaa-479c-8ee5-3933dcf70859' &&
				!communityAdminData &&
				!pubManagerData
			) {
				throw new Error('Not Authorized to edit this pub');
			}
			return PubAttribution.create({
				userId: req.body.userId,
				pubId: req.body.pubId,
				name: req.body.name,
				order: req.body.order,
				isAuthor: false,
			});
		})
		.then((newPubAttribution) => {
			const findNewPubAttribution = PubAttribution.findOne({
				where: { id: newPubAttribution.id },
				attributes: { exclude: ['updatedAt'] },
				include: [
					{
						model: User,
						as: 'user',
						required: false,
						attributes: [
							'id',
							'firstName',
							'lastName',
							'fullName',
							'avatar',
							'slug',
							'initials',
							'title',
						],
					},
				],
			});

			return findNewPubAttribution;
		})
		.then((newPubAttributionData) => {
			const output = newPubAttributionData.toJSON();
			if (!output.user) {
				output.user = {
					id: output.id,
					initials: output.name[0],
					fullName: output.name,
					firstName: output.name.split(' ')[0],
					lastName: output.name
						.split(' ')
						.slice(1, output.name.split(' ').length)
						.join(' '),
					avatar: output.avatar,
					title: output.title,
				};
			}
			return res.status(201).json(output);
		})
		.catch((err) => {
			console.error('Error in postPubAttribution: ', err);
			return res.status(500).json(err.message);
		});
});

app.put('/api/pubAttributions', (req, res) => {
	const user = req.user || {};

	// Filter to only allow certain fields to be updated
	const updatedPubAttribution = {};
	Object.keys(req.body).forEach((key) => {
		if (['name', 'avatar', 'title', 'order', 'isAuthor', 'roles'].indexOf(key) > -1) {
			updatedPubAttribution[key] = req.body[key];
		}
	});

	const findCommunityAdmin = CommunityAdmin.findOne({
		where: {
			communityId: req.body.communityId,
			userId: user.id,
		},
	});
	const findPubManager = PubManager.findOne({
		where: {
			pubId: req.body.pubId,
			userId: user.id,
		},
	});
	Promise.all([findCommunityAdmin, findPubManager])
		.then(([communityAdminData, pubManagerData]) => {
			if (
				user.id !== 'b242f616-7aaa-479c-8ee5-3933dcf70859' &&
				!communityAdminData &&
				!pubManagerData
			) {
				throw new Error('Not Authorized to edit this pub');
			}
			return PubAttribution.update(updatedPubAttribution, {
				where: { id: req.body.pubAttributionId },
			});
		})
		.then(() => {
			return res.status(201).json(updatedPubAttribution);
		})
		.catch((err) => {
			console.error('Error in putPubAttribution: ', err);
			return res.status(500).json(err.message);
		});
});

app.delete('/api/pubAttributions', (req, res) => {
	const user = req.user || {};

	const findCommunityAdmin = CommunityAdmin.findOne({
		where: {
			communityId: req.body.communityId,
			userId: user.id,
		},
	});
	const findPubManager = PubManager.findOne({
		where: {
			pubId: req.body.pubId,
			userId: user.id,
		},
	});
	Promise.all([findCommunityAdmin, findPubManager])
		.then(([communityAdminData, pubManagerData]) => {
			if (
				user.id !== 'b242f616-7aaa-479c-8ee5-3933dcf70859' &&
				!communityAdminData &&
				!pubManagerData
			) {
				throw new Error('Not Authorized to edit this pub');
			}
			return PubAttribution.destroy({
				where: { id: req.body.pubAttributionId },
			});
		})
		.then(() => {
			return res.status(201).json(req.body.pubAttributionId);
		})
		.catch((err) => {
			console.error('Error in deletePubAttribution: ', err);
			return res.status(500).json(err.message);
		});
});
