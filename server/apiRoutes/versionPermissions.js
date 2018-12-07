import app from '../server';
import { PubManager, User, CommunityAdmin, VersionPermission } from '../models';
import { setPubSearchData } from '../searchUtilities';

app.post('/api/versionPermissions', (req, res)=> {
	// Authenticate user. Make sure they have edit permissions on the given pub.

	const user = req.user || {};

	const findCommunityAdmin = CommunityAdmin.findOne({
		where: {
			communityId: req.body.communityId,
			userId: user.id,
		}
	});
	const findPubManager = PubManager.findOne({
		where: {
			pubId: req.body.pubId,
			userId: user.id
		},
	});
	Promise.all([findCommunityAdmin, findPubManager])
	.then(([communityAdminData, pubManagerData])=> {
		if (user.id !== 'b242f616-7aaa-479c-8ee5-3933dcf70859' && !communityAdminData && !pubManagerData) {
			throw new Error('Not Authorized to edit this pub');
		}
		return VersionPermission.create({
			userId: req.body.userId,
			pubId: req.body.pubId,
			versionId: req.body.versionId,
			permissions: 'view',
		});
	})
	.then((newVersionPermission)=> {
		const findNewVersionPermission = VersionPermission.findOne({
			where: { id: newVersionPermission.id },
			attributes: { exclude: ['updatedAt'] },
			include: [
				{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'fullName', 'avatar', 'slug', 'initials', 'title'] }
			]
		});

		return findNewVersionPermission;
	})
	.then((newVersionPermissionData)=> {
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
		return res.status(201).json(newVersionPermissionData);
	})
	.catch((err)=> {
		console.error('Error in postVersionPermission: ', err);
		return res.status(500).json(err.message);
	});
});

app.put('/api/versionPermissions', (req, res)=> {
	const user = req.user || {};

	// Filter to only allow certain fields to be updated
	const updatedVersionPermission = {};
	Object.keys(req.body).forEach((key)=> {
		if (['permissions'].indexOf(key) > -1) {
			updatedVersionPermission[key] = req.body[key];
		}
	});

	const findCommunityAdmin = CommunityAdmin.findOne({
		where: {
			communityId: req.body.communityId,
			userId: user.id,
		}
	});
	const findPubManager = PubManager.findOne({
		where: {
			pubId: req.body.pubId,
			userId: user.id
		},
	});
	Promise.all([findCommunityAdmin, findPubManager])
	.then(([communityAdminData, pubManagerData])=> {
		if (user.id !== 'b242f616-7aaa-479c-8ee5-3933dcf70859' && !communityAdminData && !pubManagerData) {
			throw new Error('Not Authorized to edit this pub');
		}
		return VersionPermission.update(updatedVersionPermission, {
			where: { id: req.body.versionPermissionId },
		});
	})
	.then(()=> {
		setPubSearchData(req.body.pubId);
		return res.status(201).json(updatedVersionPermission);
	})
	.catch((err)=> {
		console.error('Error in putVersionPermission: ', err);
		return res.status(500).json(err.message);
	});
});

app.delete('/api/versionPermissions', (req, res)=> {
	const user = req.user || {};

	const findCommunityAdmin = CommunityAdmin.findOne({
		where: {
			communityId: req.body.communityId,
			userId: user.id,
		}
	});
	const findPubManager = PubManager.findOne({
		where: {
			pubId: req.body.pubId,
			userId: user.id
		},
	});
	Promise.all([findCommunityAdmin, findPubManager])
	.then(([communityAdminData, pubManagerData])=> {
		if (user.id !== 'b242f616-7aaa-479c-8ee5-3933dcf70859' && !communityAdminData && !pubManagerData) {
			throw new Error('Not Authorized to edit this pub');
		}
		return VersionPermission.destroy({
			where: { id: req.body.versionPermissionId },
		});
	})
	.then(()=> {
		setPubSearchData(req.body.pubId);
		return res.status(201).json(req.body.versionPermissionId);
	})
	.catch((err)=> {
		console.error('Error in deleteVersionPermission: ', err);
		return res.status(500).json(err.message);
	});
});
