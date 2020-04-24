/* eslint-disable */
import { Sequelize, Op } from 'sequelize';
import Color from 'color';
import {
	sequelize,
	Pub,
	Discussion,
	Branch,
	Member,
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
	Thread,
	ThreadComment,
	PubTag,
	Community,
	WorkerTask,
	Release,
} from './models';
// import { generateHash } from './utils';
import mudder from 'mudder';

console.log('Beginning Migration');

const generateHash = (length) => {
	const tokenLength = length || 32;
	const possible = 'abcdefghijklmnopqrstuvwxyz0123456789';

	let hash = '';
	for (let index = 0; index < tokenLength; index += 1) {
		hash += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return hash;
};

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
	// .then(() => {
	// 	// Handle addition of Export model and Branch.exports field
	// 	return sequelize.sync();
	// })
	// .then(() => {
	// 	return Promise.all([
	// 		sequelize.queryInterface.addColumn('Communities', 'navLinks', {
	// 			type: Sequelize.JSONB,
	// 		}),
	// 		sequelize.queryInterface.addColumn('Communities', 'footerLinks', {
	// 			type: Sequelize.JSONB,
	// 		}),
	// 		sequelize.queryInterface.addColumn('Communities', 'footerTitle', {
	// 			type: Sequelize.TEXT,
	// 		}),
	// 		sequelize.queryInterface.addColumn('Communities', 'footerImage', {
	// 			type: Sequelize.TEXT,
	// 		}),
	// 	]);
	// })
	// .then(() => {
	// 	return Promise.all([
	// 		sequelize.queryInterface.addColumn('Pubs', 'pubStyleId', {
	// 			type: Sequelize.UUID,
	// 		}),
	// 	]);
	// .then(() => {
	// 	return Promise.all(['PubAttributions', 'CollectionAttributions'].map(tableName => 
	// 		sequelize.queryInterface.addColumn(
	// 			tableName,
	// 			'orcid',
	// 			{ type: Sequelize.STRING }
	// 		)
	// 	));
	// })
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
