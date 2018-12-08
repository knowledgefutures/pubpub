import algoliasearch from 'algoliasearch';
import stopword from 'stopword';
import { Pub, Community, Version, VersionPermission, PubAttribution, User, PubManager, Page } from './models';
import stopWordList from '../searchSync/stopwords';

const client = algoliasearch(process.env.ALGOLIA_ID, process.env.ALGOLIA_KEY);
const pubsIndex = client.initIndex('pubs');
const pagesIndex = client.initIndex('pages');


const lengthInUtf8Bytes = (str)=> {
	// Matches only the 10.. bytes that are non-initial characters in a multi-byte sequence.
	const m = encodeURIComponent(str).match(/%[89ABab]/g);
	return str.length + (m ? m.length : 0);
};

const validateTextSize = (stringArray)=> {
	return stringArray.map((string)=> {
		const stringSize = lengthInUtf8Bytes(string);
		if (stringSize > 8500) {
			const re = new RegExp(`.{1,${Math.floor(8000 / (Math.ceil(stringSize / 8000) + 1))}}`, 'g');
			return string.match(re);
		}
		return string;
	}).reduce((prev, curr) => {
		/* Flatten array */
		return prev.concat(curr);
	}, []);
};

const jsonToTextChunks = (docJson)=> {
	const getText = (node)=> {
		if (node.content) {
			return node.content.reduce((prev, curr)=> {
				return `${prev} ${getText(curr)}`;
			}, '');
		}
		if (node.text) { return node.text; }
		return '';
	};
	const text = typeof docJson === 'string'
		? ''
		: getText(docJson).replace(/\s\s+/g, ' ');
	const splitText = stopword.removeStopwords(text.split(' '), stopWordList).join(' ').match(/.{1,8000}/g) || [''];
	return validateTextSize(splitText);
};

export const deletePageSearchData = (pageId)=> {
	return pagesIndex.deleteBy({
		filters: `pageId:${pageId}`
	})
	.catch((err)=> {
		console.error('Error deleting Page search data: ', err);
	});
};

export const setPageSearchData = (pageId)=> {
	return deletePageSearchData(pageId)
	.then(()=> {
		return Page.findOne({
			where: {
				id: pageId,
			},
			include: [
				{
					model: Community,
					as: 'community',
				}
			]
		});
	})
	.then((page)=> {
		if (!page) { return null; }
		const dataToSync = [];
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
			jsonToTextChunks(block.content.text).forEach((textChunk)=> {
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
		return pagesIndex.addObjects(dataToSync);
	})
	.catch((err)=> {
		console.error('Error setting Page search data: ', err);
	});
};

// Find all communities they are an admin of
// Find all versionPermissions that person is listed on
export const deletePubSearchData = (pubId)=> {
	return pubsIndex.deleteBy({
		filters: `pubId:${pubId}`
	})
	.catch((err)=> {
		console.error('Error deleting Pub search data: ', err);
	});
};

export const setPubSearchData = (pubId)=> {
	return deletePubSearchData(pubId)
	.then(()=> {
		return Pub.findOne({
			where: {
				id: pubId,
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
					where: { isPublic: true },
					attributes: ['createdAt', 'id', 'isPublic', 'isCommunityAdminShared', 'content'],
					required: false,
				},
				{
					model: VersionPermission,
					as: 'versionPermissions',
					where: {
						// We only need to get the versionPermissions for items related to the working draft,
						// since all version are isPublic
						versionId: { $eq: null }
					},
					separate: true,
					required: false,
				},
				{
					model: PubManager,
					as: 'managers',
					separate: true,
				},
			]
		});
	})
	.then((pubRaw)=> {
		if (!pubRaw) { return null; }
		const dataToSync = [];
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


		// const versions = [draftVersion, ...pub.versions];
		const versions = [draftVersion];
		const publicVersion = pub.versions.reduce((prev, curr)=> {
			if (!prev || curr.createdAt > prev.createdAt) { return curr; }
			return prev;
		}, undefined);
		if (publicVersion) {
			versions.push(publicVersion);
		}

		versions.forEach((version)=> {
			const versionPermissionIds = pub.versionPermissions.filter((versionPermission)=> {
				if (version.id === 'draft') { return !versionPermission.versionId; }
				return versionPermission.versionId === version.id;
			}).map((versionPermission)=> {
				return versionPermission.userId;
			});

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
				versionAdminAccessId: (pub.isCommunityAdminManaged || version.isCommunityAdminShared) && pub.community.id,
				versionAccessIds: [...versionPermissionIds, ...managerIds],
				versionCreatedAt: version.createdAt,
				versionContent: undefined,
			};

			jsonToTextChunks(version.content).forEach((textChunk)=> {
				dataToSync.push({
					...data,
					versionContent: textChunk,
				});
			});
		});
		return pubsIndex.addObjects(dataToSync);
	})
	.catch((err)=> {
		console.error('Error setting Pub search data: ', err);
	});
};

export const updateCommunityData = (communityId)=> {
	const getObjectIds = (index)=> {
		return new Promise((resolve, reject)=> {
			const browser = index.browseAll('', {
				filters: `communityId:${communityId}`,
				attributesToRetrieve: ['objectId'],
			});
			let objectIds = [];

			browser.on('result', (content)=> {
				objectIds = objectIds.concat(content.hits.map((hit)=> {
					return hit.objectID;
				}));
			});

			browser.on('end', ()=> {
				resolve(objectIds);
			});

			browser.on('error', (err)=> {
				reject(err);
			});
		});
	};
	const findCommunityData = Community.findOne({
		where: {
			id: communityId
		}
	});

	return Promise.all([getObjectIds(pubsIndex), getObjectIds(pagesIndex), findCommunityData])
	.then(([pubObjectIds, pageObjectIds, communityData])=> {
		if (!communityData) { return null; }
		const updatedCommunityData = {
			communityId: communityData.id,
			communityDomain: communityData.domain || `${communityData.subdomain}.pubpub.org`,
			communityAvatar: communityData.avatar,
			communityTitle: communityData.title,
			communityColor: communityData.accentColor,
		};
		const pubObjects = pubObjectIds.map((objectId)=> {
			return { objectID: objectId, ...updatedCommunityData };
		});
		const pageObjects = pageObjectIds.map((objectId)=> {
			return { objectID: objectId, ...updatedCommunityData };
		});

		const updatePubSearchRecords = pubsIndex.partialUpdateObjects(pubObjects);
		const updatePageSearchRecords = pagesIndex.partialUpdateObjects(pageObjects);
		return Promise.all([updatePubSearchRecords, updatePageSearchRecords]);
	})
	.catch((err)=> {
		console.error('Error updating community search data: ', err);
	});
};

export const updateUserData = (userId)=> {
	return PubAttribution.findAll({
		where: {
			isAuthor: true,
			userId: userId,
		},
		attributes: ['id', 'isAuthor', 'userId', 'pubId']
	})
	.then((attributionsData)=> {
		if (!attributionsData.length) { return null; }

		const pubIds = attributionsData.map((pubAttribution)=> {
			return pubAttribution.pubId;
		});
		const updateFunctions = pubIds.map((pubId)=> {
			return setPubSearchData(pubId);
		});
		return Promise.all(updateFunctions);
	})
	.catch((err)=> {
		console.error('Error updating user search data: ', err);
	});
};
