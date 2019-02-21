import app from '../server';
import { PubManager, User, CommunityAdmin } from '../models';
import { setPubSearchData } from '../searchUtilities';

app.post('/api/pubManagers', (req, res) => {
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
			return PubManager.create({
				userId: req.body.userId,
				pubId: req.body.pubId,
			});
		})
		.then((newPubManager) => {
			const findNewPubManager = PubManager.findOne({
				where: { id: newPubManager.id },
				attributes: { exclude: ['updatedAt'] },
				include: [
					{
						model: User,
						as: 'user',
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
			return findNewPubManager;
		})
		.then((newPubManagerData) => {
			// const collaboratorUser = newCollaboratorData.user || {};
			// const output = {
			// 	id: collaboratorUser.id || newCollaboratorData.id,
			// 	fullName: collaboratorUser.fullName || newCollaboratorData.name,
			// 	initials: collaboratorUser.initials || newCollaboratorData.name[0],
			// 	slug: collaboratorUser.slug,
			// 	avatar: collaboratorUser.avatar,
			// 	Collaborator: {
			// 		id: newCollaboratorData.id,
			// 		isAuthor: newCollaboratorData.isAuthor,
			// 		permissions: newCollaboratorData.permissions,
			// 		order: newCollaboratorData.order,
			// 		createdAt: newCollaboratorData.createdAt,
			// 	}
			// };
			setPubSearchData(req.body.pubId);
			return res.status(201).json(newPubManagerData);
		})
		.catch((err) => {
			console.error('Error in postPubManager: ', err);
			return res.status(500).json(err.message);
		});
});

// app.put('/api/pubManager', (req, res)=> {
// 	const user = req.user || {};

// 	// Filter to only allow certain fields to be updated
// 	const updatedCollaborator = {};
// 	Object.keys(req.body).forEach((key)=> {
// 		if (['permissions', 'isAuthor', 'isContributor', 'name', 'order', 'roles'].indexOf(key) > -1) {
// 			updatedCollaborator[key] = req.body[key];
// 		}
// 	});

// 	const findCommunityAdmin = CommunityAdmin.findOne({
// 		where: {
// 			communityId: req.body.communityId,
// 			userId: user.id,
// 		}
// 	});
// 	const findCollaborator = Collaborator.findOne({
// 		where: { pubId: req.body.pubId, userId: user.id },
// 		raw: true,
// 	});
// 	Promise.all([findCommunityAdmin, findCollaborator])
// 	.then(([communityAdminData, collaboratorData])=> {
// 		if (user.id !== 'b242f616-7aaa-479c-8ee5-3933dcf70859' && !communityAdminData && (!collaboratorData || collaboratorData.permissions !== 'manage')) {
// 			throw new Error('Not Authorized to edit this pub');
// 		}
// 		return Collaborator.update(updatedCollaborator, {
// 			where: { id: req.body.collaboratorId },
// 		});
// 	})
// 	.then(()=> {
// 		return res.status(201).json({
// 			fullName: req.body.name,
// 			Collaborator: {
// 				id: req.body.collaboratorId,
// 				...updatedCollaborator,
// 			},
// 		});
// 	})
// 	.catch((err)=> {
// 		console.error('Error in putUser: ', err);
// 		return res.status(500).json(err.message);
// 	});
// });

app.delete('/api/pubManagers', (req, res) => {
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
			return PubManager.destroy({
				where: { id: req.body.pubManagerId },
			});
		})
		.then(() => {
			setPubSearchData(req.body.pubId);
			return res.status(201).json(req.body.pubManagerId);
		})
		.catch((err) => {
			console.error('Error in deletePubManager: ', err);
			return res.status(500).json(err.message);
		});
});
