/* eslint-disable no-console */
/* eslint-disable newline-per-chained-call */
import Promise from 'bluebird';
import algoliasearch from 'algoliasearch';
import stopword from 'stopword';
// import fs from 'fs';
import { Pub, Community, Version, VersionPermission, PubAttribution, User, PubManager, Page } from '../server/models';

const client = algoliasearch(process.env.ALGOLIA_ID, process.env.ALGOLIA_KEY);
const pubIndex = client.initIndex('pubs');
const pageIndex = client.initIndex('pages');

console.log('Beginning search sync');

function lengthInUtf8Bytes(str) {
	// Matches only the 10.. bytes that are non-initial characters in a multi-byte sequence.
	const m = encodeURIComponent(str).match(/%[89ABab]/g);
	return str.length + (m ? m.length : 0);
}

const validateTextSize = (stringArray)=> {
	return stringArray.map((string)=> {
		const stringSize = lengthInUtf8Bytes(string);
		if (stringSize > 8000) {
			const re = new RegExp(`.{1,${Math.floor(64000 / stringSize)}}`, 'g');
			return string.match(re);
		}
		return string;
	}).reduce((prev, curr) => {
		/* Flatten array */
		return prev.concat(curr);
	}, []);
};

const findAndIndexPubs = (pubIds)=> {
	return Pub.findAll({
		where: {
			id: pubIds,
		},
		include: [
			{
				model: Community,
				as: 'community',
			},
			{
				model: PubAttribution,
				as: 'attributions',
				required: false,
				separate: true,
				include: [{ model: User, as: 'user', required: false, attributes: ['id', 'fullName'] }],
			},
			{
				// separate: true,
				model: Version,
				as: 'versions',
				attributes: ['createdAt', 'id', 'isPublic', 'isCommunityAdminShared', 'content'],
				required: false,
			},
			{
				model: VersionPermission,
				as: 'versionPermissions',
				separate: true,
				required: false,
			},
			{
				model: PubManager,
				as: 'managers',
				separate: true,
			},
		]
	})
	.then((pubs)=> {
		const dataToSync = [];
		pubs.forEach((pubRaw)=> {
			const pub = pubRaw.toJSON();
			const authorByline = pub.attributions.map((attribution)=> {
				if (attribution.user) { return attribution; }
				return {
					...attribution,
					user: {
						id: attribution.id,
						fullName: attribution.name,
					}
				};
			}).filter((attribution)=> {
				return attribution.isAuthor;
			}).sort((foo, bar)=> {
				if (foo.order < bar.order) { return -1; }
				if (foo.order > bar.order) { return 1; }
				if (foo.createdAt < bar.createdAt) { return 1; }
				if (foo.createdAt > bar.createdAt) { return -1; }
				return 0;
			}).map((author, index, array)=> {
				const separator = index === array.length - 1 || array.length === 2 ? '' : ', ';
				const prefix = index === array.length - 1 && index !== 0 ? ' and ' : '';
				return `${prefix}${author.user.fullName}${separator}`;
			}).join('');
			const draftVersion = {
				id: 'draft',
				isPublic: pub.draftPermissions !== 'private',
				isCommunityAdminShared: pub.communityAdminDraftPermissions !== 'none',
				createdAt: pub.createdAt,
				content: '',
			};
			const managerIds = pub.managers.map((manager)=> {
				return manager.userId;
			});
			const versions = [draftVersion, ...pub.versions];
			versions.filter((version, index)=> {
				// return true;
				return index === 0;
			}).forEach((version)=> {
				const versionPermissionIds = pub.versionPermissions.filter((versionPermission)=> {
					if (version.id === 'draft') { return !versionPermission.versionId; }
					return versionPermission.versionId === version.id;
				}).map((versionPermission)=> {
					return versionPermission.userId;
				});


				const getText = (node)=> {
					if (node.content) {
						return node.content.reduce((prev, curr)=> {
							return `${prev} ${getText(curr)}`;
						}, '');
					}
					if (node.text) { return node.text; }
					return '';
				};
				const text = typeof version.content === 'string'
					? ''
					: getText(version.content).replace(/\s\s+/g, ' ');

				/* Assume metadata is 2000 characters = 2000 bytes */
				const data = {
					pubId: pub.id,
					title: pub.title,
					slug: pub.slug,
					avatar: pub.avatar,
					description: pub.description,
					byline: authorByline
						? `by ${authorByline}`
						: '',
					communityId: pub.community.id,
					communityDomain: pub.community.domain || `${pub.community.subdomain}.pubpub.org`,
					communityAvatar: pub.community.avatar,
					communityTitle: pub.community.title,
					communityColor: pub.community.accentColor,
					versionId: version.id,
					versionIsPublic: version.isPublic,
					versionIsAdminAccessible: pub.isCommunityAdminManaged || version.isCommunityAdminShared,
					versionAccessIds: [...versionPermissionIds, ...managerIds],
					versionCreatedAt: version.createdAt,
					versionContent: undefined,
				};

				const splitText = stopword.removeStopwords(text.split(' ')).join(' ').match(/.{1,8000}/g) || [''];
				const validatedSplitText = validateTextSize(splitText);
				validatedSplitText.forEach((textChunk)=> {
					dataToSync.push({
						...data,
						versionContent: textChunk,
					});
				});
			});
		});
		// return true;
		// return pubIndex.addObjects(dataToSync);
		// return new Promise((resolve, reject)=> {
		// 	fs.writeFile(`${__dirname}/pubs-${index}.json`, JSON.stringify(dataToSync), (err)=> {
		// 		if (err) {
		// 			reject(err);
		// 		}
		// 		resolve('The file was saved!');
		// 	});
		// });
		const smallArraysOfVersions = [];
		while (dataToSync.length) {
			smallArraysOfVersions.push(dataToSync.splice(0, 1000));
		}
		return Promise.each(smallArraysOfVersions, (objectsArray)=> {
			return pubIndex.addObjects(objectsArray);
		});
	});
};


const findAndIndexPages = (pageIds)=> {
	return Page.findAll({
		where: {
			id: pageIds,
		},
		include: [
			{
				model: Community,
				as: 'community',
			}
		]
	})
	.then((pages)=> {
		const dataToSync = [];
		pages.forEach((page)=> {
			const data = {
				pageId: page.id,
				title: page.title,
				slug: page.slug,
				avatar: page.avatar,
				description: page.description,
				isPublic: page.isPublic,
				communityId: page.community.id,
				communityDomain: page.community.domain || `${page.community.subdomain}.pubpub.org`,
				communityAvatar: page.community.avatar,
				communityTitle: page.community.title,
				communityColor: page.community.accentColor,
				content: undefined
			};

			const layout = page.layout || [];
			let hasContent = false;
			layout.filter((block)=> {
				return block.type === 'text' && block.content.text;
			}).forEach((block)=> {
				const getText = (node)=> {
					if (node.content) {
						return node.content.reduce((prev, curr)=> {
							return `${prev} ${getText(curr)}`;
						}, '');
					}
					if (node.text) { return node.text; }
					return '';
				};
				const text = getText(block.content.text).replace(/\s\s+/g, ' ');
				const splitText = stopword.removeStopwords(text.split(' ')).join(' ').match(/.{1,8000}/g) || [''];
				const validatedSplitText = validateTextSize(splitText);
				validatedSplitText.forEach((textChunk)=> {
					hasContent = true;
					dataToSync.push({
						...data,
						content: textChunk,
					});
				});
			});
			if (!hasContent) {
				dataToSync.push(data);
			}
		});

		return pageIndex.addObjects(dataToSync);
	});
};

new Promise((resolve, reject)=> {
	return resolve();
	// return reject('Fail-safe reject');
})
// .then(()=> {
// 	return pubIndex.setSettings({
// 		unretrievableAttributes: ['versionIsAdminAccessible', 'versionAccessIds', 'versionContent'],
// 		searchableAttributes: ['title', 'description', 'slug', 'byline', 'versionContent', 'communityTitle', 'communityDomain'],
// 		distinct: true,
// 		attributeForDistinct: 'pubId',
// 		attributesForFaceting: [
// 			'filterOnly(versionIsPublic)',
// 			'filterOnly(versionAccessIds)',
// 			'filterOnly(versionIsAdminAccessible)',
// 			'filterOnly(communityId)',
// 		],
// 	});
// })
// .then(()=> {
// 	return Pub.findAll({
// 		attributes: ['id'],
// 		limit: 100,
// 	});
// })
// .then((pubIds)=> {
// 	const smallArrays = [];
// 	while (pubIds.length) {
// 		smallArrays.push(pubIds.splice(0, 25).map((item)=> { return item.id; }));
// 	}
// 	return Promise.each(smallArrays, (idArray, index)=> {
// 		console.log('Starting pub batch ', index + 1, ' of ', smallArrays.length);
// 		return findAndIndexPubs(idArray);
// 	});
// })
.then(()=> {
	return pageIndex.setSettings({
		unretrievableAttributes: ['content'],
		searchableAttributes: ['title', 'description', 'slug', 'content', 'communityTitle', 'communityDomain'],
		distinct: true,
		attributeForDistinct: 'pageId',
		attributesForFaceting: [
			'filterOnly(isPublic)',
			'filterOnly(communityId)',
		],
	});
})
.then(()=> {
	return Page.findAll({
		attributes: ['id'],
		// limit: 100,
	});
})
.then((pageIds)=> {
	const smallArrays = [];
	while (pageIds.length) {
		smallArrays.push(pageIds.splice(0, 25).map((item)=> { return item.id; }));
	}
	return Promise.each(smallArrays, (idArray, index)=> {
		console.log('Starting page batch ', index + 1, ' of ', smallArrays.length);
		return findAndIndexPages(idArray);
	});
})
.catch((err)=> {
	console.log('Error with search sync', err);
})
.finally(()=> {
	console.log('Ending search sync');
	process.exit();
});
