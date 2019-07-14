import stopword from 'stopword';
import stopWordList from './stopwords';
import {
	Pub,
	Community,
	Branch,
	BranchPermission,
	PubAttribution,
	User,
	PubManager,
	Page,
} from '../../server/models';
import { getBranchDoc } from '../../server/utils/firebaseAdmin';

const lengthInUtf8Bytes = (str) => {
	// Matches only the 10.. bytes that are non-initial characters in a multi-byte sequence.
	const m = encodeURIComponent(str).match(/%[89ABab]/g);
	return str.length + (m ? m.length : 0);
};

const validateTextSize = (stringArray) => {
	return stringArray
		.map((string) => {
			const stringSize = lengthInUtf8Bytes(string);
			if (stringSize > 7500) {
				const re = new RegExp(
					`.{1,${Math.floor(7000 / (Math.ceil(stringSize / 7000) + 1))}}`,
					'g',
				);
				return string.match(re);
			}
			return string;
		})
		.reduce((prev, curr) => {
			/* Flatten array */
			return prev.concat(curr);
		}, []);
};

const jsonToTextChunks = (docJson) => {
	const getText = (node) => {
		if (node.content) {
			return node.content.reduce((prev, curr) => {
				return `${prev} ${getText(curr)}`;
			}, '');
		}
		if (node.text) {
			return node.text;
		}
		return '';
	};
	const text = typeof docJson === 'string' ? '' : getText(docJson).replace(/\s\s+/g, ' ');
	const splitText = stopword
		.removeStopwords(text.split(' '), stopWordList)
		.join(' ')
		.match(/.{1,7000}/g) || [''];
	return validateTextSize(splitText);
};

export const getPubSearchData = (pubIds) => {
	const dataToSync = [];
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
				include: [
					{
						model: User,
						as: 'user',
						required: false,
						attributes: ['id', 'fullName'],
					},
				],
			},
			{
				model: Branch,
				as: 'branches',
				required: true,
				include: [
					{
						model: BranchPermission,
						as: 'permissions',
						separate: true,
						required: false,
					},
				],
			},
			{
				model: PubManager,
				as: 'managers',
				separate: true,
			},
		],
	})
		.then((pubs) => {
			const branchesToSync = [];
			pubs.forEach((pubData) => {
				const pub = pubData.toJSON();
				const authorByline = pub.attributions
					.map((attribution) => {
						if (attribution.user) {
							return attribution;
						}
						return {
							...attribution,
							user: {
								id: attribution.id,
								fullName: attribution.name,
							},
						};
					})
					.filter((attribution) => {
						return attribution.isAuthor;
					})
					.sort((foo, bar) => {
						if (foo.order < bar.order) {
							return -1;
						}
						if (foo.order > bar.order) {
							return 1;
						}
						if (foo.createdAt < bar.createdAt) {
							return 1;
						}
						if (foo.createdAt > bar.createdAt) {
							return -1;
						}
						return 0;
					})
					.map((author, index, array) => {
						const separator =
							index === array.length - 1 || array.length === 2 ? '' : ', ';
						const prefix = index === array.length - 1 && index !== 0 ? ' and ' : '';
						return `${prefix}${author.user.fullName}${separator}`;
					})
					.join('');

				const managerIds = pub.managers.map((manager) => {
					return manager.userId;
				});

				pub.branches.forEach((branch) => {
					const branchPermissionIds = branch.permissions.map((branchPermission) => {
						return branchPermission.userId;
					});
					/* Assume metadata is 3000 characters = 3000 bytes */
					const data = {
						pubId: pub.id,
						title: pub.title,
						slug: pub.slug,
						avatar: pub.avatar,
						description: pub.description,
						byline: authorByline ? `by ${authorByline}` : '',
						communityId: pub.community.id,
						communityDomain:
							pub.community.domain || `${pub.community.subdomain}.pubpub.org`,
						communityTitle: pub.community.title,
						communityAccentColorLight: pub.community.accentColorLight,
						communityAccentColorDark: pub.community.accentColorDark,
						communityHeaderLogo: pub.community.headerLogo,
						communityHeaderColorType: pub.community.headerColorType,
						communityUseHeaderTextAccent: pub.community.useHeaderTextAccent,
						branchId: branch.id,
						branchShortId: branch.shortId,
						branchIsPublic: branch.publicPermissions !== 'none',
						branchAdminAccessId:
							branch.communityAdminPermissions !== 'none' && pub.community.id,
						branchAccessIds: [...branchPermissionIds, ...managerIds],
						branchCreatedAt: branch.createdAt,
						branchContent: undefined,
					};
					branchesToSync.push(data);
				});
			});
			return branchesToSync;
		})
		.then((branchesToSync) => {
			return branchesToSync.reduce((promise, branchData) => {
				return promise
					.then(() => {
						return getBranchDoc(branchData.pubId, branchData.branchId);
					})
					.then((branchDocData) => {
						const { content } = branchDocData;
						if (content) {
							jsonToTextChunks(content).forEach((textChunk) => {
								dataToSync.push({
									...branchData,
									branchContent: textChunk,
								});
							});
						}
					});
			}, Promise.resolve());
		})
		.then(() => {
			return dataToSync;
		});
};

export const getPageSearchData = (pageIds) => {
	return Page.findAll({
		where: {
			id: pageIds,
		},
		include: [
			{
				model: Community,
				as: 'community',
			},
		],
	}).then((pages) => {
		const dataToSync = [];
		pages.forEach((page) => {
			const data = {
				pageId: page.id,
				title: page.title,
				slug: page.slug,
				avatar: page.avatar,
				description: page.description,
				isPublic: page.isPublic,
				communityId: page.community.id,
				communityDomain: page.community.domain || `${page.community.subdomain}.pubpub.org`,
				communityTitle: page.community.title,
				communityAccentColorLight: page.community.accentColorLight,
				communityAccentColorDark: page.community.accentColorDark,
				communityHeaderLogo: page.community.headerLogo,
				communityHeaderColorType: page.community.headerColorType,
				communityUseHeaderTextAccent: page.community.useHeaderTextAccent,
				content: undefined,
			};

			const layout = page.layout || [];
			let hasContent = false;
			layout
				.filter((block) => {
					return block.type === 'text' && block.content.text;
				})
				.forEach((block) => {
					jsonToTextChunks(block.content.text).forEach((textChunk) => {
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
		return dataToSync;
	});
};
