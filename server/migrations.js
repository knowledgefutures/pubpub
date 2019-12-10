import { Sequelize, Op } from 'sequelize';
import Color from 'color';
import {
	sequelize,
	Pub,
	Discussion,
	Branch,
	BranchPermission,
	Member,
	CommunityAdmin,
	Export,
	PubManagers,
	Version,
	PubManager,
	Collaborator,
	VersionPermission,
	PubAttribution,
	Collection,
	CollectionPub,
	CollectionAttribution,
	Page,
	Tag,
	PubTag,
	Community,
	WorkerTask,
} from './models';
import { generateHash } from './utils';
import mudder from 'mudder';

console.log('Beginning Migration');

new Promise((resolve) => {
	return resolve();
})
	// .then(()=> {
	// 	return sequelize.queryInterface.addColumn('Pubs', 'isCommunityAdminManaged', { type: Sequelize.BOOLEAN });
	// })
	// .then(()=> {
	// 	return sequelize.queryInterface.addColumn('Pubs', 'communityAdminDraftPermissions', {
	// 		type: Sequelize.ENUM,
	// 		values: ['none', 'view', 'edit'],
	// 		defaultValue: 'none',
	// 	});
	// })
	// .then(()=> {
	// 	return sequelize.queryInterface.addColumn('Pubs', 'draftPermissions', {
	// 		type: Sequelize.ENUM,
	// 		values: ['private', 'publicView', 'publicEdit'],
	// 		defaultValue: 'private',
	// 	});
	// })
	// .then(()=> {
	// 	/* Migrate to isCommunityAdminManaged property */
	// 	return Pub.findAll({
	// 		where: {
	// 			adminPermissions: 'manage'
	// 		}
	// 	})
	// 	.then((pubsData)=> {
	// 		const pubIds = pubsData.map((pubData)=> {
	// 			return pubData.id;
	// 		});
	// 		return Pub.update({ isCommunityAdminManaged: true }, {
	// 			where: {
	// 				id: { $in: pubIds }
	// 			}
	// 		});
	// 	});
	// })
	// .then(()=> {
	// 	/* Migrate to communityAdminDraftPermissions edit property */
	// 	return Pub.findAll({
	// 		where: {
	// 			adminPermissions: 'edit'
	// 		}
	// 	})
	// 	.then((pubsData)=> {
	// 		const pubIds = pubsData.map((pubData)=> {
	// 			return pubData.id;
	// 		});
	// 		return Pub.update({ communityAdminDraftPermissions: 'edit' }, {
	// 			where: {
	// 				id: { $in: pubIds }
	// 			}
	// 		});
	// 	});
	// })
	// .then(()=> {
	// 	/* Migrate to communityAdminDraftPermissions view property */
	// 	return Pub.findAll({
	// 		where: {
	// 			adminPermissions: 'view'
	// 		}
	// 	})
	// 	.then((pubsData)=> {
	// 		const pubIds = pubsData.map((pubData)=> {
	// 			return pubData.id;
	// 		});
	// 		return Pub.update({ communityAdminDraftPermissions: 'view' }, {
	// 			where: {
	// 				id: { $in: pubIds }
	// 			}
	// 		});
	// 	});
	// })
	// .then(()=> {
	// 	/* Migrate to draftPermissions publicView property */
	// 	return Pub.findAll({
	// 		where: {
	// 			collaborationMode: 'publicView'
	// 		}
	// 	})
	// 	.then((pubsData)=> {
	// 		const pubIds = pubsData.map((pubData)=> {
	// 			return pubData.id;
	// 		});
	// 		return Pub.update({ draftPermissions: 'publicView' }, {
	// 			where: {
	// 				id: { $in: pubIds }
	// 			}
	// 		});
	// 	});
	// })
	// .then(()=> {
	// 	/* Migrate to draftPermissions publicEdit property */
	// 	return Pub.findAll({
	// 		where: {
	// 			collaborationMode: 'publicEdit'
	// 		}
	// 	})
	// 	.then((pubsData)=> {
	// 		const pubIds = pubsData.map((pubData)=> {
	// 			return pubData.id;
	// 		});
	// 		return Pub.update({ draftPermissions: 'publicEdit' }, {
	// 			where: {
	// 				id: { $in: pubIds }
	// 			}
	// 		});
	// 	});
	// })
	// .then(()=> {
	// 	return sequelize.queryInterface.renameColumn('Pubs', 'editHash', 'draftEditHash');
	// })
	// .then(()=> {
	// 	return sequelize.queryInterface.renameColumn('Pubs', 'viewHash', 'draftViewHash');
	// })
	// .then(()=> {
	// 	return sequelize.queryInterface.addColumn('Versions', 'isPublic', { type: Sequelize.BOOLEAN });
	// })
	// .then(()=> {
	// 	/* Set all versions to be public, since that is what they were when published */
	// 	return Version.update({ isPublic: true }, {
	// 		where: { isPublic: null }
	// 	});
	// })
	// .then(()=> {
	// 	return sequelize.queryInterface.addColumn('Versions', 'isCommunityAdminShared', { type: Sequelize.BOOLEAN });
	// })
	// .then(()=> {
	// 	/* Set isCommunityAdminShared for all versions of pubs which had adminPermissions !== none */
	// 	return Pub.findAll({
	// 		where: {
	// 			adminPermissions: { $ne: 'none' }
	// 		}
	// 	})
	// 	.then((pubsData)=> {
	// 		const pubIds = pubsData.map((pubData)=> {
	// 			return pubData.id;
	// 		});
	// 		return Version.update({ isCommunityAdminShared: true }, {
	// 			where: {
	// 				pubId: { $in: pubIds }
	// 			}
	// 		});
	// 	});
	// })
	// .then(()=> {
	// 	return sequelize.queryInterface.addColumn('Versions', 'viewHash', { type: Sequelize.STRING });
	// })
	// .then(()=> {
	// 	/* Set viewHash for all versions */
	// 	return Version.findAll()
	// 	.then((versionsData)=> {
	// 		const versionEvents = versionsData.map((versionData)=> {
	// 			return Version.update({ viewHash: generateHash(8) }, {
	// 				where: { id: versionData.id }
	// 			});
	// 		});
	// 		return Promise.all(versionEvents);
	// 	});
	// })
	// .then(()=> {
	// 	/* Create PubManager items */
	// 	return Collaborator.findAll({
	// 		where: { permissions: 'manage' }
	// 	})
	// 	.then((collaboratorsData)=> {
	// 		const newPubManagers = collaboratorsData.map((collaboratorData)=> {
	// 			return { userId: collaboratorData.userId, pubId: collaboratorData.pubId };
	// 		});
	// 		return PubManager.bulkCreate(newPubManagers);
	// 	});
	// })
	// .then(()=> {
	// 	/* Create VersionPermission items for edit and view */
	// 	return Collaborator.findAll({
	// 		where: { permissions: { $in: ['edit', 'view'] } }
	// 	})
	// 	.then((collaboratorsData)=> {
	// 		const pubIds = collaboratorsData.map((collaboratorData)=> {
	// 			return collaboratorData.pubId;
	// 		});
	// 		const findVersions = Version.findAll({
	// 			where: {
	// 				pubId: { $in: pubIds }
	// 			}
	// 		});
	// 		return Promise.all([collaboratorsData, findVersions]);
	// 	})
	// 	.then(([collaboratorsData, versionsData])=> {
	// 		const userIdByPubId = {};
	// 		collaboratorsData.forEach((item)=> {
	// 			userIdByPubId[item.pubId] = item.userId;
	// 		});

	// 		/* For all edit Collaborators, we need to create a record on the Draft with edit permissions */
	// 		const newDraftPermissionsEdit = collaboratorsData.filter((item)=> {
	// 			return item.permissions === 'edit';
	// 		}).map((collaboratorData)=> {
	// 			return {
	// 				pubId: collaboratorData.pubId,
	// 				permissions: 'edit',
	// 				userId: collaboratorData.userId,
	// 			};
	// 		});

	// 		/* For all view Collaborators, we need to create a record on the Draft with view permissions */
	// 		const newDraftPermissionsView = collaboratorsData.filter((item)=> {
	// 			return item.permissions === 'view';
	// 		}).map((collaboratorData)=> {
	// 			return {
	// 				pubId: collaboratorData.pubId,
	// 				permissions: 'view',
	// 				userId: collaboratorData.userId,
	// 			};
	// 		});

	// 		/* For all collaborators (view and edit) we need to create a record for the version with view permissions */
	// 		const newVersionPermissions = versionsData.map((versionData)=> {
	// 			return {
	// 				pubId: versionData.pubId,
	// 				permissions: 'view',
	// 				userId: userIdByPubId[versionData.pubId],
	// 				versionId: versionData.id
	// 			};
	// 		});
	// 		return VersionPermission.bulkCreate([...newDraftPermissionsEdit, ...newDraftPermissionsView, ...newVersionPermissions]);
	// 	});
	// })
	// .then(()=> {
	// 	/* Create PubAttribution for all Collaborators with isAuthor or isContributor */
	// 	return Collaborator.findAll({
	// 		where: {
	// 			$or: [
	// 				{ isAuthor: true },
	// 				{ isContributor: true }
	// 			]
	// 		}
	// 	})
	// 	.then((collaboratorsData)=> {
	// 		const newPubAttributions = collaboratorsData.map((collaboratorData)=> {
	// 			return {
	// 				name: collaboratorData.name,
	// 				order: collaboratorData.order,
	// 				isAuthor: collaboratorData.isAuthor,
	// 				roles: collaboratorData.roles,
	// 				userId: collaboratorData.userId,
	// 				pubId: collaboratorData.pubId,
	// 			};
	// 		});
	// 		return PubAttribution.bulkCreate(newPubAttributions);
	// 	});
	// })
	// .then(()=> {
	// 	/* Migrate Collections to Pages */
	// 	return Collection.findAll({})
	// 	.then((collectionsData)=> {
	// 		const newPages = collectionsData.map((collection)=> {
	// 			return {
	// 				id: collection.id,
	// 				title: collection.title,
	// 				description: collection.description,
	// 				slug: collection.slug,
	// 				isPublic: collection.isPublic,
	// 				viewHash: collection.createPubHash,
	// 				layout: collection.layout,
	// 				communityId: collection.communityId,
	// 			};
	// 		});
	// 		return Page.bulkCreate(newPages);
	// 	});
	// })
	// .then(()=> {
	// 	/* Create a Tag for all existing Collections */
	// 	return Collection.findAll({})
	// 	.then((collectionsData)=> {
	// 		const newTags = collectionsData.map((collection)=> {
	// 			return {
	// 				id: collection.id,
	// 				title: collection.title || 'Home',
	// 				isRestricted: true,
	// 				isPublic: collection.isPublic,
	// 				pageId: collection.id, /* Use the same id since that's what we used when migrating collection->page */
	// 				communityId: collection.communityId,
	// 			};
	// 		});
	// 		return Tag.bulkCreate(newTags);
	// 	});
	// })
	// .then(()=> {
	// 	/* Migrate CollectionPubs to PubTags */
	// 	return CollectionPub.findAll({})
	// 	.then((collectionPubsData)=> {
	// 		const newPubTags = collectionPubsData.map((collectionPub)=> {
	// 			return {
	// 				collectionId: collectionPub.collectionId,
	// 				pubId: collectionPub.pubId,
	// 			};
	// 		});
	// 		return PubTag.bulkCreate(newPubTags);
	// 	});
	// })
	// .then(()=> {
	// 	/* Update layout on all Pages */
	// 	return Page.findAll()
	// 	.then((pagesData)=> {
	// 		const layoutUpdates = pagesData.filter((pageData)=> {
	// 			return pageData.layout;
	// 		}).map((pageData)=> {
	// 			const newLayout = pageData.layout.map((block, index)=> {
	// 				if (index === 0 && pageData.slug) {
	// 					return {
	// 						...block,
	// 						content: {
	// 							...block.content,
	// 							title: pageData.title,
	// 						}
	// 					};
	// 				}
	// 				return block;
	// 			}).map((block)=> {
	// 				if (block.type !== 'pubs') { return block; }
	// 				return {
	// 					...block,
	// 					content: {
	// 						...block.content,
	// 						size: undefined,
	// 						pubPreviewType: block.content.size,
	// 						collectionIds: [pageData.id]
	// 					}
	// 				};
	// 			});
	// 			return Page.update({ layout: newLayout }, {
	// 				where: { id: pageData.id }
	// 			});
	// 		});
	// 		return Promise.all(layoutUpdates);
	// 	});
	// })
	// .then(()=> {
	// 	return sequelize.queryInterface.addColumn('Pubs', 'review', {
	// 		type: Sequelize.JSONB,
	// 	});
	// })
	// .then(()=> {
	// 	return sequelize.queryInterface.addColumn('Discussions', 'discussionChannelId', {
	// 		type: Sequelize.UUID
	// 	});
	// })
	// .then(()=> {
	// 	return sequelize.queryInterface.addColumn('Communities', 'hideCreatePubButton', { type: Sequelize.BOOLEAN });
	// })
	// .then(()=> {
	// 	return sequelize.queryInterface.addColumn('Communities', 'defaultPubCollections', { type: Sequelize.JSONB });
	// })
	// .then(()=> {
	// 	return Promise.all([
	// 		sequelize.queryInterface.addColumn('Pages', 'avatar', { type: Sequelize.TEXT }),
	// 		sequelize.queryInterface.addColumn('Pages', 'isNarrowWidth', { type: Sequelize.BOOLEAN }),
	// 	]);
	// })
	// .then(()=> {
	// 	return sequelize.queryInterface.addColumn('Communities', 'hideNav', { type: Sequelize.BOOLEAN });
	// })
	// .then(()=> {
	// 	return sequelize.queryInterface.addColumn('Communities', 'hideLandingBanner', { type: Sequelize.BOOLEAN });
	// })
	// .then(()=> {
	// 	return sequelize.queryInterface.addColumn('Signups', 'communityId', { type: Sequelize.UUID });
	// })
	// .then(()=> {
	// 	return sequelize.queryInterface.addColumn('DiscussionChannels', 'isArchived', { type: Sequelize.BOOLEAN });
	// })
	// .then(()=> {
	// 	return sequelize.queryInterface.addColumn('Communities', 'isFeatured', { type: Sequelize.BOOLEAN });
	// })
	// .then(()=> {
	// 	return sequelize.queryInterface.addColumn('WorkerTasks', 'attemptCount', { type: Sequelize.INTEGER });
	// })
	// .then(()=> {
	// 	return Promise.all([
	// 		sequelize.queryInterface.addColumn('Communities', 'headerLogo', { type: Sequelize.TEXT }),
	// 		sequelize.queryInterface.addColumn('Communities', 'headerLinks', { type: Sequelize.JSONB }),
	// 		sequelize.queryInterface.addColumn('Communities', 'hideHeaderLogo', { type: Sequelize.BOOLEAN }),
	// 		sequelize.queryInterface.addColumn('Communities', 'heroTextColor', { type: Sequelize.TEXT }),
	// 		sequelize.queryInterface.addColumn('Communities', 'useHeaderGradient', { type: Sequelize.BOOLEAN }),
	// 		sequelize.queryInterface.addColumn('Communities', 'heroImage', { type: Sequelize.TEXT }),
	// 		sequelize.queryInterface.addColumn('Communities', 'heroTitle', { type: Sequelize.TEXT }),
	// 		sequelize.queryInterface.addColumn('Communities', 'heroText', { type: Sequelize.TEXT }),
	// 		sequelize.queryInterface.addColumn('Communities', 'heroPrimaryButton', { type: Sequelize.JSONB }),
	// 		sequelize.queryInterface.addColumn('Communities', 'heroSecondaryButton', { type: Sequelize.JSONB }),
	// 		sequelize.queryInterface.addColumn('Communities', 'heroAlign', { type: Sequelize.TEXT }),
	// 		sequelize.queryInterface.addColumn('Communities', 'hideHero', { type: Sequelize.BOOLEAN }),
	// 		sequelize.queryInterface.addColumn('Communities', 'heroLogo', { type: Sequelize.TEXT }),
	// 		sequelize.queryInterface.addColumn('Communities', 'heroBackgroundImage', { type: Sequelize.TEXT }),
	// 		sequelize.queryInterface.addColumn('Communities', 'heroBackgroundColor', { type: Sequelize.TEXT }),
	// 	]);
	// })
	// .then(() => {
	// 	return Promise.all([
	// 		sequelize.query('UPDATE "Communities" SET "hideHero" = "hideLandingBanner"'),
	// 		sequelize.query('UPDATE "Communities" SET "headerLogo" = "smallHeaderLogo"'),
	// 		sequelize.query('UPDATE "Communities" SET "heroLogo" = "largeHeaderLogo"'),
	// 		sequelize.query('UPDATE "Communities" SET "heroBackgroundImage" = "largeHeaderBackground"'),
	// 		sequelize.query('UPDATE "Communities" SET "heroTitle" = "title"'),
	// 		sequelize.query('UPDATE "Communities" SET "useHeaderGradient" = true'),
	// 		sequelize.query('UPDATE "Communities" SET "hideHeaderLogo" = true'),
	// 		sequelize.query('UPDATE "Communities" SET "heroBackgroundColor" = "accentColor"'),
	// 		sequelize.query('UPDATE "Communities" SET "heroTextColor" = "accentTextColor"'),
	// 	]);
	// })
	// .then(()=> {
	// 	return Promise.all([
	// 		sequelize.queryInterface.removeColumn('Communities', 'hideLandingBanner'),
	// 		sequelize.queryInterface.removeColumn('Communities', 'largeHeaderLogo'),
	// 		sequelize.queryInterface.removeColumn('Communities', 'largeHeaderBackground'),
	// 		sequelize.queryInterface.removeColumn('Communities', 'smallHeaderLogo'),
	// 	]);
	// })
	// .then(()=> {
	// 	return sequelize.queryInterface.addColumn('Pubs', 'downloads', { type: Sequelize.JSONB });
	// })
	// .then(() => {
	// return (
	// 	Collection.sync()
	// 		.then(() =>
	// 			sequelize.getQueryInterface().addColumn('Communities', 'defaultPubCollections', Sequelize.JSONB),
	// 		)
	// 		.then(() => {
	// 			return Community.findAll({
	// 				where: {
	// 					defaultPubTags: { [Op.ne]: null }
	// 					// id: 'c153eec9-671d-4d38-a720-8e7164f6e12a'
	// 				}
	// 			}).then((communityData) => {
	// 				return Promise.all(
	// 					communityData.map((data) => {
	// 						console.log(data.defaultPubTags, data.id);
	// 						return Community.update(
	// 							{
	// 								updatedAt: data.updatedAt,
	// 								defaultPubCollections: data.defaultPubTags,
	// 							},
	// 							{
	// 								where: {
	// 									id: data.id,
	// 								},
	// 							},
	// 						);
	// 					}),
	// 				);
	// 			});
	// 		})
	// );
	// .renameColumn('Communities', 'defaultPubTags', 'defaultPubCollections'))
	// .then(() => {
	// 	return Tag.findAll().then(tags => {
	// 		const collections = tags.map(tag => {
	// 			return {...tag.dataValues, kind: "tag"};
	// 		});
	// 		return Collection.bulkCreate(collections);
	// 	})
	// })
	// .then(() => CollectionPub.sync())
	// .then(() => {
	// 	return PubTag.findAll().then(pubTags => {
	// 		const pubTagIds = {};
	// 		const collectionPubs = pubTags.filter((pt) => {
	// 			if (pubTagIds[`${pt.pubId}_${pt.tagId}`]) {
	// 				console.log('yep - got a false', `${pt.pubId}_${pt.tagId}`);
	// 				return false;
	// 			}
	// 			pubTagIds[`${pt.pubId}_${pt.tagId}`] = true;
	// 			return true;
	// 		}).map(pt => {
	// 			return {pubId: pt.pubId, collectionId: pt.tagId};
	// 		});
	// 		return CollectionPub.bulkCreate(collectionPubs);
	// 	});
	// })
	// .then(() => CollectionAttribution.sync())
	// })
	// .then(() => {
	// 	return Page.findAll().then((pageData) => {
	// 		const pageUpdates = pageData
	// 			.filter((page) => {
	// 				return page.layout;
	// 			})
	// 			.map((page) => {
	// 				const newLayout = page.layout.map((block) => {
	// 					if (block.type === 'pubs') {
	// 						const newBlock = { ...block };
	// 						if (block.content.tagIds) {
	// 							newBlock.content.collectionIds = block.content.tagIds;
	// 							delete newBlock.content.tagIds;
	// 						}
	// 						return newBlock;
	// 					}
	// 					if (block.type === 'banner') {
	// 						const newBlock = { ...block };
	// 						if (block.content.defaultTagIds) {
	// 							newBlock.content.defaultCollectionIds = block.content.defaultTagIds;
	// 							delete newBlock.content.defaultTagIds;
	// 						}
	// 						return newBlock;
	// 					}
	// 					return block;
	// 				});
	// 				return Page.update(
	// 					{ layout: newLayout },
	// 					{
	// 						where: {
	// 							id: page.id,
	// 						},
	// 					},
	// 				);
	// 			});
	// 		return Promise.all(pageUpdates);
	// 	});
	// })
	// .then(() => {
	// 	console.log("updating CollectionPubs");
	// 	return Collection.findAll({ attributes: ["id"] })
	// 		.then(collections => collections
	// 			.reduce((promise, collection) => {
	// 				console.log("Collection", collection.id);
	// 				return promise.then(() =>
	// 					CollectionPub.findAll({where: {collectionId: collection.id, rank: null }})
	// 						.then(collectionPubs => {
	// 							const ranks = mudder.base36.mudder('a', 'z', collectionPubs.length);
	// 							return Promise.all(
	// 								collectionPubs.map((cp, index) => cp.update({rank: ranks[index] }))
	// 							);
	// 						})
	// 				);
	// 			}, Promise.resolve())
	// 		)
	// })
	// .then(() => {
	// 	console.log("Syncing attributions models");
	// 	return Promise.all([
	// 		sequelize.queryInterface.addColumn('CollectionAttributions', 'affiliation', { type: Sequelize.TEXT }),
	// 		sequelize.queryInterface.addColumn('PubAttributions', 'affiliation', { type: Sequelize.TEXT }),
	// 	]);
	// })
	// .then(() => {
	// 	/* Set new Community accent columns */
	// 	return Promise.all([
	// 		sequelize.queryInterface.addColumn('Communities', 'accentColorDark', { type: Sequelize.STRING }),
	// 		sequelize.queryInterface.addColumn('Communities', 'accentColorLight', { type: Sequelize.STRING }),
	// 		sequelize.queryInterface.addColumn('Communities', 'headerColorType', {
	// 			type: Sequelize.ENUM,
	// 			values: ['light', 'dark', 'custom'],
	// 			defaultValue: 'light',
	// 		}),
	// 	])
	// 	.then(() => {
	// 		return Community.findAll();
	// 	})
	// 	.then((communitiesData) => {
	// 		const communityUpdates = communitiesData.map((community) => {
	// 			const accentWasLight = Color(community.accentColor).isLight();
	// 			console.log(community.id, community.headerColorType);
	// 			const updates = {
	// 				accentColorLight: accentWasLight ? community.accentColor : '#FFFFFF',
	// 				accentColorDark: !accentWasLight ? community.accentColor : '#000000',
	// 				headerColorType: accentWasLight ? 'light' : 'dark',
	// 			};
	// 			// console.log(updates);
	// 			return Community.update(updates, {
	// 				where: { id: community.id }
	// 			});
	// 		});
	// 		return Promise.all(communityUpdates);
	// 	});
	// })
	// .then(() => {
	// 	/* Set new Pub header style columns */
	// 	return Promise.all([
	// 		sequelize.queryInterface.addColumn('Pubs', 'headerStyle', {
	// 			type: Sequelize.ENUM,
	// 			values: ['white-blocks', 'black-blocks'],
	// 			defaultValue: null,
	// 		}),
	// 		sequelize.queryInterface.addColumn('Pubs', 'headerBackgroundType', {
	// 			type: Sequelize.ENUM,
	// 			values: ['color', 'image'],
	// 			defaultValue: 'color',
	// 		}),
	// 		sequelize.queryInterface.addColumn('Pubs', 'headerBackgroundColor', { type: Sequelize.STRING }),
	// 		sequelize.queryInterface.addColumn('Pubs', 'headerBackgroundImage', { type: Sequelize.TEXT }),
	// 	])
	// 	.then(() => {
	// 		return Pub.findAll();
	// 	})
	// 	.then((pubsData) => {
	// 		const pubUpdates = pubsData.map((pub) => {
	// 			const updates = {
	// 				headerBackgroundType: pub.avatar && pub.useHeaderImage ? 'image' : 'color',
	// 				headerBackgroundImage: pub.useHeaderImage ? pub.avatar : null,
	// 			};
	// 			return Pub.update(updates, {
	// 				where: { id: pub.id }
	// 			});
	// 		});
	// 		return Promise.all(pubUpdates);
	// 	});
	// })
	// .then(() => {
	// 	return sequelize.queryInterface.addColumn('Communities', 'useHeaderTextAccent', { type: Sequelize.BOOLEAN });
	// })
	// .then(() => {
	// 	return sequelize.queryInterface.addColumn('Users', 'gdprConsent', {
	// 		type: Sequelize.BOOLEAN,
	// 	});
	// })
	// .then(() => {
	// 	return sequelize.queryInterface.addColumn('Branches', 'firstKeyAt', {
	// 		type: Sequelize.DATE,
	// 	});
	// })
	// .then(() => {
	// 	return sequelize.queryInterface.addColumn('Branches', 'latestKeyAt', {
	// 		type: Sequelize.DATE,
	// 	});
	// })
	// .then(() => {
	// 	return sequelize.queryInterface.addColumn('PubVersions', 'pubId', {
	// 		type: Sequelize.UUID,
	// 	});
	// })
	// .then(() => {
	// 	return sequelize.queryInterface.addColumn('Discussions', 'initAnchorText', {
	// 		type: Sequelize.JSONB,
	// 	});
	// })
	// .then(() => {
	// 	return sequelize.queryInterface.addColumn('Collections', 'readNextPreviewSize', {
	// 		type: Sequelize.ENUM,
	// 		values: ['none', 'medium', 'minimal', 'choose-best'],
	// 		defaultValue: 'choose-best',
	// 	});
	// })
	// .then(() => {
	// 	return sequelize.queryInterface.addColumn('Pubs', 'licenseSlug', {
	// 		type: Sequelize.TEXT,
	// 		defaultValue: 'cc-by'
	// 	});
	// })
	// .then(() => {
	// 	return sequelize.queryInterface.addColumn('Communities', 'premiumLicenseFlag', {
	// 		type: Sequelize.BOOLEAN,
	// 		defaultValue: false,
	// 	});
	// })

	/* New Dashboard migrations */
	.then(() => {
		return Promise.all([
			// sequelize.queryInterface.addColumn('Collections', 'viewHash', {
			// 	type: Sequelize.STRING,
			// }),
			// sequelize.queryInterface.addColumn('Collections', 'editHash', {
			// 	type: Sequelize.STRING,
			// }),
			// sequelize.queryInterface.addColumn('Collections', 'avatar', {
			// 	type: Sequelize.TEXT,
			// }),
			// sequelize.queryInterface.addColumn('Collections', 'isPublicDiscussions', {
			// 	type: Sequelize.BOOLEAN,
			// }),
			// sequelize.queryInterface.addColumn('Collections', 'isPublicReviews', {
			// 	type: Sequelize.BOOLEAN,
			// }),
			// sequelize.queryInterface.addColumn('Communities', 'isPublic', {
			// 	type: Sequelize.BOOLEAN,
			// }),
			// sequelize.queryInterface.addColumn('Communities', 'isPublicDiscussions', {
			// 	type: Sequelize.BOOLEAN,
			// }),
			// sequelize.queryInterface.addColumn('Communities', 'isPublicReviews', {
			// 	type: Sequelize.BOOLEAN,
			// }),
			// sequelize.queryInterface.addColumn('Communities', 'viewHash', {
			// 	type: Sequelize.STRING,
			// }),
			// sequelize.queryInterface.addColumn('Communities', 'editHash', {
			// 	type: Sequelize.STRING,
			// }),
			// sequelize.queryInterface.addColumn('Communities', 'organizationId', {
			// 	type: Sequelize.UUID,
			// }),
			// sequelize.queryInterface.addColumn('Discussions', 'isPublic', {
			// 	type: Sequelize.BOOLEAN,
			// }),
			// sequelize.queryInterface.addColumn('Discussions', 'initBranchId', {
			// 	type: Sequelize.UUID,
			// }),
			// sequelize.queryInterface.addColumn('Discussions', 'collectionId', {
			// 	type: Sequelize.UUID,
			// }),
			// sequelize.queryInterface.addColumn('Discussions', 'organizationId', {
			// 	type: Sequelize.UUID,
			// }),
			// sequelize.queryInterface.addColumn('Pubs', 'isPublic', {
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
			// sequelize.queryInterface.addColumn('Pubs', 'viewHash', {
			// 	type: Sequelize.STRING,
			// }),
			// sequelize.queryInterface.addColumn('Pubs', 'editHash', {
			// 	type: Sequelize.STRING,
			// }),
		]);
	})
	.then(() => {
		return Promise.all([
			// sequelize.queryInterface.changeColumn('Discussions', 'pubId', {
			// 	type: Sequelize.UUID,
			// }),
			// sequelize.queryInterface.changeColumn('Discussions', 'communityId', {
			// 	type: Sequelize.UUID,
			// }),
		]);
	})
	.then(() => {
		/* Migrate Collection hashes */
		// return Collection.findAll({ attributes: ['id'] }).then((data) => {
		// 	const updates = data.map((item) => {
		// 		return Collection.update(
		// 			{ viewHash: generateHash(8), editHash: generateHash(8) },
		// 			{ where: { id: item.id } },
		// 		);
		// 	});
		// 	return Promise.all(updates);
		// });
	})
	.then(() => {
		/* Migrate Community isPublic */
		// return Community.findAll({ attributes: ['id'] }).then((data) => {
		// 	const updates = data.map((item) => {
		// 		return Community.update(
		// 			{ isPublic: true },
		// 			{ where: { id: item.id } },
		// 		);
		// 	});
		// 	return Promise.all(updates);
		// });
	})
	.then(() => {
		/* Migrate Community hashes */
		// return Community.findAll({ attributes: ['id'] }).then((data) => {
		// 	const updates = data.map((item) => {
		// 		return Community.update(
		// 			{ viewHash: generateHash(8), editHash: generateHash(8) },
		// 			{ where: { id: item.id } },
		// 		);
		// 	});
		// 	return Promise.all(updates);
		// });
	})
	.then(() => {
		/* Migrate Discussion isPublic and initBranchId */
		/* Discussions are public if the branch they were on */
		/* was publicPermissions 'view' or 'edit'. If the branch they were on */
		/* is not public, then isPublic is false, and the Members will be */
		/* populated accordingly to allow access. PubManagers will go to Members with 'manage' */
		/* Branch access folks will go to Members with 'edit' or 'view' - both with discussion ability */
		// return Discussion.findAll({
		// 	attributes: ['id', 'branchId'],
		// 	include: [
		// 		{
		// 			model: Branch,
		// 			as: 'branch',
		// 			attributes: ['id', 'publicPermissions'],
		// 			// required: true,
		// 			// include: [{ model: BranchPermission, as: 'permissions' }],
		// 		},
		// 	],
		// }).then((discussionData) => {
		// 	const updates = discussionData.map((item) => {
		// 		return Discussion.update(
		// 			{
		// 				isPublic: item.branch && item.branch.publicPermissions !== 'none',
		// 				initBranchId: item.branchId,
		// 			},
		// 			{ where: { id: item.id } },
		// 		);
		// 	});
		// 	return Promise.all(updates);
		// });
	})
	.then(() => {
		/* Migrate Pub isPublic  */
		/* Pubs are public if their draft branch had publicPermissions !== 'none' */
		/* Pubs have publicDiscussions if their public branch had publicPermissions === 'discuss' */
		/* This will remove some edge case possibilities, such as #public: view, #draft: discuss, */
		/* but that is not a permissions configuration we're allowing in the new model. */
		// return Pub.findAll({
		// 	attributes: ['id'],
		// 	include: [
		// 		{
		// 			model: Branch,
		// 			as: 'branches',
		// 			attributes: ['id', 'publicPermissions', 'title'],
		// 		},
		// 	],
		// }).then((pubData) => {
		// 	const updates = pubData.map((item) => {
		// 		const publicBranch = item.branches.find((br) => br.title === 'public') || {};
		// 		const draftBranch = item.branches.find((br) => br.title === 'draft') || {};
		// 		return Pub.update(
		// 			{
		// 				isPublic: draftBranch.publicPermissions !== 'none',
		// 				isPublicDiscussions: publicBranch.publicPermissions === 'discuss',
		// 			},
		// 			{ where: { id: item.id } },
		// 		);
		// 	});
		// 	return Promise.all(updates);
		// });
	})
	.then(() => {
		/* Migrate Pub hashes */
		// return Pub.findAll({ attributes: ['id'] }).then((data) => {
		// 	const updates = data.map((item) => {
		// 		return Pub.update(
		// 			{ viewHash: generateHash(8), editHash: generateHash(8) },
		// 			{ where: { id: item.id } },
		// 		);
		// 	});
		// 	return Promise.all(updates);
		// });
	})
	.then(() => {
		/* Migrate BranchPermissions and PubManagers */
		/* Branch permissions turn into members with associated permissions access */
		/* PubManagers turn into members with 'manage' permission */
		// const getBranchPermissions = BranchPermission.findAll();
		// const getPubManagers = PubManager.findAll();
		// return Promise.all([getBranchPermissions, getPubManagers]).then(
		// 	([branchPermissionsData, pubManagersData]) => {
		// 		const newBranchMembers = branchPermissionsData.map((item) => {
		// 			return {
		// 				id: item.id,
		// 				permissions: item.permissions,
		// 				pubId: item.pubId,
		// 				userId: item.userId,
		// 				createdAt: item.createdAt,
		// 				updatedAt: item.updatedAt,
		// 			};
		// 		});
		// 		const didSetOwner = {};
		// 		const newManagerMembers = pubManagersData
		// 			.sort((foo, bar) => {
		// 				if (foo.createdAt < bar.createdAt) {
		// 					return -1;
		// 				}
		// 				if (foo.createdAt > bar.createdAt) {
		// 					return 1;
		// 				}
		// 				return 0;
		// 			})
		// 			.map((item) => {
		// 				const isOwner = !didSetOwner[item.pubId];
		// 				didSetOwner[item.pubId] = true;
		// 				return {
		// 					id: item.id,
		// 					permissions: 'manage',
		// 					pubId: item.pubId,
		// 					userId: item.userId,
		// 					isOwner: isOwner,
		// 					createdAt: item.createdAt,
		// 					updatedAt: item.updatedAt,
		// 				};
		// 			});
		// 		const newMembers = [...newBranchMembers, ...newManagerMembers];
		// 		const newMembersObject = {};
		// 		const permissionLevels = ['view', 'discuss', 'edit', 'manage'];
		// 		newMembers.forEach((member) => {
		// 			const index = `${member.userId}-${member.pubId}`;
		// 			const existingPermissionLevel = newMembersObject[index]
		// 				? permissionLevels.indexOf(newMembersObject[index].permissions)
		// 				: -1;
		// 			const currPermissionLevel = permissionLevels.indexOf(member.permissions);
		// 			if (
		// 				existingPermissionLevel === -1 ||
		// 				currPermissionLevel > existingPermissionLevel
		// 			) {
		// 				newMembersObject[index] = member;
		// 			}
		// 		});
		// 		const dedupedNewMembers = Object.values(newMembersObject);
		// 		return Member.bulkCreate(dedupedNewMembers);
		// 	},
		// );
	})
	.then(() => {
		/* Migrate CommunityAdmin */
		// return CommunityAdmin.findAll().then((adminsData) => {
		// 	const didSetOwner = {};
		// 	const newManagerMembers = adminsData
		// 		.sort((foo, bar) => {
		// 			if (foo.createdAt < bar.createdAt) {
		// 				return -1;
		// 			}
		// 			if (foo.createdAt > bar.createdAt) {
		// 				return 1;
		// 			}
		// 			return 0;
		// 		})
		// 		.map((item) => {
		// 			const isOwner = !didSetOwner[item.communityId];
		// 			didSetOwner[item.communityId] = true;
		// 			return {
		// 				id: item.id,
		// 				permissions: 'manage',
		// 				communityId: item.communityId,
		// 				userId: item.userId,
		// 				isOwner: isOwner,
		// 				createdAt: item.createdAt,
		// 				updatedAt: item.updatedAt,
		// 			};
		// 		});
		// 	return Member.bulkCreate(newManagerMembers);
		// });
	})
	/* Need to add in dashboard world */
	/*
		Collection.viewHash
		Collection.editHash
		Collection.avatar
		Collection.isPublicDiscussions
		Collection.isPublicReviews
		Community.isPublic
		Community.isPublicDiscussions
		Community.isPublicReviews
		Community.viewHash
		Community.editHash
		Community.organizationId
		Discussion.isPublic (Need some table for Discussion/Review visibility)
		Discussion.initBranchId
		Discussion.collectionId
		Discussion.organizationId
		Pub.isPublic
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

	.catch((err) => {
		console.log('Error with Migration', err);
	})
	.finally(() => {
		console.log('Ending Migration');
		process.exit();
	});

/* In case we need to remove an enum type again */
// .then(()=> {
// 	return sequelize.queryInterface.sequelize.query('DROP TYPE "enum_Pubs_communityAdminDraftPermissions";');
// })
