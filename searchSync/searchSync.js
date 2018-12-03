/* eslint-disable no-console */
/* eslint-disable newline-per-chained-call */
import algoliasearch from 'algoliasearch';
import stopword from 'stopword';
import { Pub, Community, Version, VersionPermission, PubAttribution, User, PubManager } from '../server/models';

const client = algoliasearch(process.env.ALGOLIA_ID, process.env.ALGOLIA_KEY);
const pubIndex = client.initIndex('pubs');

console.log('Beginning search sync');

new Promise((resolve, reject)=> {
	return resolve();
	// return reject('Fail-safe reject');
})
.then(()=> {
	return pubIndex.setSettings({
		unretrievableAttributes: ['versionIsAdminAccessible', 'versionAccessIds', 'versionContent'],
		searchableAttributes: ['title', 'description', 'slug', 'byline', 'versionContent'],
		distinct: true,
		attributeForDistinct: 'pubId',
		attributesForFaceting: [
			'filterOnly(versionIsPublic)',
			'filterOnly(versionAccessIds)',
			'filterOnly(versionIsAdminAccessible)',
			'filterOnly(communityId)',
		],
	});
})
.then(()=> {
	return Pub.findAll({
		// limit: 10,
		where: {
			communityId: '7808da6b-94d1-436d-ad79-2e036a8e4428',
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
	});
})
.then((pubs)=> {
	const dataToSync = [];
	pubs.forEach((pub)=> {
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
		versions.forEach((version)=> {
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
			splitText.forEach((textChunk)=> {
				dataToSync.push({
					...data,
					versionContent: textChunk,
				});
			});
		});
	});
	// return true;
	return pubIndex.addObjects(dataToSync);
})
.catch((err)=> {
	console.log('Error with search sync', err);
})
.finally(()=> {
	console.log('Ending search sync');
	process.exit();
});
