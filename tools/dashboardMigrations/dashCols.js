import { Sequelize } from 'sequelize';

import { asyncMap } from 'utils/async';

import {
	sequelize,
	Pub,
	Discussion,
	Branch,
	BranchPermission,
	Member,
	CommunityAdmin,
	PubManager,
	Collection,
	Community,
	User,
} from '../../server/models';

const generateHash = (length) => {
	const tokenLength = length || 32;
	const possible = 'abcdefghijklmnopqrstuvwxyz0123456789';

	let hash = '';
	for (let index = 0; index < tokenLength; index += 1) {
		hash += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return hash;
};

export default async () => {
	/* Migrate BranchPermissions and PubManagers */
	/* Branch permissions turn into members with associated permissions access */
	/* PubManagers turn into members with 'manage' permission */
	const getBranchPermissions = BranchPermission.findAll();
	const getPubManagers = PubManager.findAll();
	const getUsers = User.findAll({ attributes: ['id'] });
	await Promise.all([getBranchPermissions, getPubManagers, getUsers]).then(
		([branchPermissionsData, pubManagersData, usersData]) => {
			const userSet = new Set();
			usersData.forEach((user) => userSet.add(user.id));
			const newBranchMembers = branchPermissionsData.map((item) => {
				return {
					id: item.id,
					permissions: item.permissions,
					pubId: item.pubId,
					userId: item.userId,
					createdAt: item.createdAt,
					updatedAt: item.updatedAt,
				};
			});
			const didSetOwner = {};
			const newManagerMembers = pubManagersData
				.sort((foo, bar) => {
					if (foo.createdAt < bar.createdAt) {
						return -1;
					}
					if (foo.createdAt > bar.createdAt) {
						return 1;
					}
					return 0;
				})
				.map((item) => {
					const isOwner = !didSetOwner[item.pubId];
					didSetOwner[item.pubId] = true;
					return {
						id: item.id,
						permissions: 'manage',
						pubId: item.pubId,
						userId: item.userId,
						isOwner,
						createdAt: item.createdAt,
						updatedAt: item.updatedAt,
					};
				});
			const newMembers = [...newBranchMembers, ...newManagerMembers].filter((member) => {
				return userSet.has(member.userId);
			});
			const newMembersObject = {};
			const permissionLevels = ['view', 'discuss', 'edit', 'manage'];
			newMembers.forEach((member) => {
				const index = `${member.userId}-${member.pubId}`;
				const existingPermissionLevel = newMembersObject[index]
					? permissionLevels.indexOf(newMembersObject[index].permissions)
					: -1;
				const currPermissionLevel = permissionLevels.indexOf(member.permissions);
				if (
					existingPermissionLevel === -1 ||
					currPermissionLevel > existingPermissionLevel
				) {
					newMembersObject[index] = member;
				}
			});
			const dedupedNewMembers = Object.values(newMembersObject);
			return Member.bulkCreate(dedupedNewMembers);
		},
	);

	/* Migrate CommunityAdmin */
	await CommunityAdmin.findAll().then((adminsData) => {
		const didSetOwner = {};
		const newManagerMembers = adminsData
			.sort((foo, bar) => {
				if (foo.createdAt < bar.createdAt) {
					return -1;
				}
				if (foo.createdAt > bar.createdAt) {
					return 1;
				}
				return 0;
			})
			.map((item) => {
				const isOwner = !didSetOwner[item.communityId];
				didSetOwner[item.communityId] = true;
				return {
					id: item.id,
					permissions: 'admin',
					communityId: item.communityId,
					userId: item.userId,
					isOwner,
					createdAt: item.createdAt,
					updatedAt: item.updatedAt,
				};
			});
		return Member.bulkCreate(newManagerMembers);
	});

	await Promise.all([
		sequelize.queryInterface.addColumn('Collections', 'viewHash', {
			type: Sequelize.STRING,
		}),
		sequelize.queryInterface.addColumn('Collections', 'editHash', {
			type: Sequelize.STRING,
		}),
		sequelize.queryInterface.addColumn('Collections', 'avatar', {
			type: Sequelize.TEXT,
		}),
		sequelize.queryInterface.addColumn('Collections', 'slug', {
			type: Sequelize.TEXT,
			unique: true,
			validate: {
				isLowercase: true,
				len: [1, 280],
				is: /^[a-zA-Z0-9-]+$/, // Must contain at least one letter, alphanumeric and underscores and hyphens
			},
		}),
		// sequelize.queryInterface.addColumn('Collections', 'isPublicBranches', {
		// 	type: Sequelize.BOOLEAN,
		// }),
		// sequelize.queryInterface.addColumn('Collections', 'isPublicDiscussions', {
		// 	type: Sequelize.BOOLEAN,
		// }),
		// sequelize.queryInterface.addColumn('Collections', 'isPublicReviews', {
		// 	type: Sequelize.BOOLEAN,
		// }),
		// sequelize.queryInterface.addColumn('Communities', 'isPublicBranches', {
		// 	type: Sequelize.BOOLEAN,
		// }),
		// sequelize.queryInterface.addColumn('Communities', 'isPublicDiscussions', {
		// 	type: Sequelize.BOOLEAN,
		// }),
		// sequelize.queryInterface.addColumn('Communities', 'isPublicReviews', {
		// 	type: Sequelize.BOOLEAN,
		// }),
		sequelize.queryInterface.addColumn('Communities', 'viewHash', {
			type: Sequelize.STRING,
		}),
		sequelize.queryInterface.addColumn('Communities', 'editHash', {
			type: Sequelize.STRING,
		}),
		// sequelize.queryInterface.addColumn('Communities', 'organizationId', {
		// 	type: Sequelize.UUID,
		// }),
		sequelize.queryInterface.addColumn('Discussions', 'isPublic', {
			type: Sequelize.BOOLEAN,
		}),
		sequelize.queryInterface.addColumn('Discussions', 'initBranchId', {
			type: Sequelize.UUID,
		}),
		sequelize.queryInterface.addColumn('Discussions', 'collectionId', {
			type: Sequelize.UUID,
		}),
		sequelize.queryInterface.addColumn('Discussions', 'organizationId', {
			type: Sequelize.UUID,
		}),
		// sequelize.queryInterface.addColumn('Pubs', 'isPublicBranches', {
		// 	type: Sequelize.BOOLEAN,
		// }),
		// sequelize.queryInterface.addColumn('Pubs', 'isPublicEdit', {
		// 	type: Sequelize.BOOLEAN,
		// }),
		// sequelize.queryInterface.addColumn('Pubs', 'isPublicDiscussions', {
		// 	type: Sequelize.BOOLEAN,
		// }),
		// sequelize.queryInterface.addColumn('Pubs', 'isPublicReviews', {
		// 	type: Sequelize.BOOLEAN,
		// }),
		sequelize.queryInterface.addColumn('Pubs', 'viewHash', {
			type: Sequelize.STRING,
		}),
		sequelize.queryInterface.addColumn('Pubs', 'editHash', {
			type: Sequelize.STRING,
		}),
		sequelize.queryInterface.addColumn('Pubs', 'citationStyle', {
			type: Sequelize.STRING,
			defaultValue: 'apa-7',
		}),
		sequelize.queryInterface.addColumn('Pubs', 'citationInlineStyle', {
			type: Sequelize.STRING,
			defaultValue: 'count',
		}),
	]);
	await Promise.all([
		sequelize.queryInterface.changeColumn('Discussions', 'pubId', {
			type: Sequelize.UUID,
		}),
		sequelize.queryInterface.changeColumn('Discussions', 'communityId', {
			type: Sequelize.UUID,
		}),
	]);

	/* Migrate Collection hashes */
	await Collection.findAll({ attributes: ['id'] }).then((data) => {
		const updates = data.map((item) => {
			return Collection.update(
				{ viewHash: generateHash(8), editHash: generateHash(8) },
				{ where: { id: item.id } },
			);
		});
		return Promise.all(updates);
	});
	/* Migrate Collection slug */
	await Collection.findAll({ attributes: ['id'] })
		.then((data) => {
			const updates = data.map((item) => {
				return Collection.update({ slug: generateHash(8) }, { where: { id: item.id } });
			});
			return Promise.all(updates);
		})
		.then(() => {
			return sequelize.queryInterface.changeColumn('Collections', 'slug', {
				type: Sequelize.TEXT,
				unique: true,
				allowNull: false,
				validate: {
					isLowercase: true,
					len: [1, 280],
					is: /^[a-zA-Z0-9-]+$/, // Must contain at least one letter, alphanumeric and underscores and hyphens
				},
			});
		});
	/* Migrate Community isPublicX */
	await Community.findAll({ attributes: ['id'] }).then((data) => {
		const updates = data.map((item) => {
			return Community.update(
				{ isPublicBranches: false, isPublicDiscussions: true, isPublicReviews: false },
				{ where: { id: item.id } },
			);
		});
		return Promise.all(updates);
	});
	/* Migrate Community hashes */
	await Community.findAll({ attributes: ['id'] }).then((data) => {
		const updates = data.map((item) => {
			return Community.update(
				{ viewHash: generateHash(8), editHash: generateHash(8) },
				{ where: { id: item.id } },
			);
		});
		return Promise.all(updates);
	});
	/* Migrate Discussion isPublic and initBranchId */
	/* Discussions are public if the branch they were on */
	/* was publicPermissions 'view' or 'edit'. If the branch they were on */
	/* is not public, then isPublic is false, and the Members will be */
	/* populated accordingly to allow access. PubManagers will go to Members with 'manage' */
	/* Branch access folks will go to Members with 'edit' or 'view' - both with discussion ability */
	await Discussion.findAll({
		attributes: ['id', 'branchId'],
		include: [
			{
				model: Branch,
				as: 'branch',
				attributes: ['id', 'publicPermissions'],
				// required: true,
				// include: [{ model: BranchPermission, as: 'permissions' }],
			},
		],
	}).then((discussionData) => {
		return asyncMap(
			discussionData,
			(item) => {
				return Discussion.update(
					{
						isPublic: item.branch && item.branch.publicPermissions !== 'none',
						// initBranchId: item.branchId,
					},
					{ where: { id: item.id } },
				);
			},
			{ concurrency: 1 },
		);
		// const updates = discussionData.map((item) => {
		// 	return Discussion.update(
		// 		{
		// 			isPublic: item.branch && item.branch.publicPermissions !== 'none',
		// 			initBranchId: item.branchId,
		// 		},
		// 		{ where: { id: item.id } },
		// 	);
		// });
		// return Promise.all(updates);
	});
	/* Migrate Pub isPublic  */
	/* Pubs are public if their draft branch had publicPermissions !== 'none' */
	/* Pubs have publicDiscussions if their public branch had publicPermissions === 'discuss' */
	/* This will remove some edge case possibilities, such as #public: view, #draft: discuss, */
	/* but that is not a permissions configuration we're allowing in the new model. */
	await Pub.findAll({
		attributes: ['id'],
		include: [
			{
				model: Branch,
				as: 'branches',
				attributes: ['id', 'publicPermissions', 'title'],
			},
		],
	}).then((pubData) => {
		const updates = pubData.map((item) => {
			const publicBranch = item.branches.find((br) => br.title === 'public') || {};
			const draftBranch = item.branches.find((br) => br.title === 'draft') || {};
			return Pub.update(
				{
					isPublicBranches: draftBranch.publicPermissions !== 'none',
					isPublicDiscussions: publicBranch.publicPermissions === 'discuss',
				},
				{ where: { id: item.id } },
			);
		});
		return Promise.all(updates);
	});
	/* Migrate Pub hashes */
	await Pub.findAll({ attributes: ['id'] }).then((data) => {
		const updates = data.map((item) => {
			return Pub.update(
				{ viewHash: generateHash(8), editHash: generateHash(8) },
				{ where: { id: item.id } },
			);
		});
		return Promise.all(updates);
	});
};

/* Need to add in dashboard world */
/*
	Collection.viewHash
	Collection.editHash
	Collection.avatar
	Collection.slug
	Collection.isPublicBranches
	Collection.isPublicDiscussions
	Collection.isPublicReviews
	Community.isPublicBranches
	Community.isPublicDiscussions
	Community.isPublicReviews
	Community.viewHash
	Community.editHash
	Community.organizationId
	Discussion.isPublic (Need some table for Discussion/Review visibility)
	Discussion.initBranchId
	Discussion.collectionId
	Discussion.organizationId
	Pub.isPublicBranches
	Pub.isPublicDiscussions
	Pub.isPublicReviews
	Pub.viewHash
	Pub.editHash
	Member.*
*/

/* Can Deprecate in dashboard world */
/*
	Branch.publicPermissions
	Branch.pubManagerPermissions
	Branch.communityAdminPermissions
	Branch.viewHash
	Branch.discussHash
	Branch.editHash
	BranchPermissions.*
	CommunityAdmin.*
	Discussion.branchId
	Pub.isCommunityAdminManaged
	PubManager.*
*/

/* Need to change in dashboard world */
/*
	Discussion.pubId [allowNull: true]
	Discussion.communityId [allowNull: true]

*/
