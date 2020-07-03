import stopword from 'stopword';
import stopWordList from './stopwords';
import {
	Pub,
	Community,
	Branch,
	PubAttribution,
	Page,
	includeUserModel,
} from '../../server/models';
import { getBranchDoc } from '../../server/utils/firebaseAdmin';
import { getScope, getMembers } from '../../server/utils/queryHelpers';
import { generatePlainAuthorString } from '../../client/components/PubPreview/pubPreviewUtils';

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

export const getPubSearchData = async (pubIds) => {
	const pubs = await Pub.findAll({
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
				include: [includeUserModel({ as: 'user' })],
			},
			{
				model: Branch,
				as: 'branches',
				required: true,
			},
		],
	});

	const branchesToSync = [];
	for (let index = 0; index < pubs.length; index++) {
		const pub = pubs[index].toJSON();
		const authorByline = generatePlainAuthorString(pub);
		// eslint-disable-next-line no-await-in-loop
		const scopeData = await getScope({ pubId: pub.id, communityId: pub.community.id });
		// eslint-disable-next-line no-await-in-loop
		const { members } = await getMembers({ scopeData: scopeData });
		const accessIds = members.map((member) => {
			return member.userId;
		});
		pub.branches.forEach((branch) => {
			/* Assume metadata is 3000 characters = 3000 bytes */
			const data = {
				pubId: pub.id,
				title: pub.title,
				slug: pub.slug,
				avatar: pub.avatar,
				description: pub.description,
				byline: authorByline ? `by ${authorByline}` : '',
				customPublishedAt: pub.customPublishedAt,
				communityId: pub.community.id,
				communityDomain: pub.community.domain || `${pub.community.subdomain}.pubpub.org`,
				communityTitle: pub.community.title,
				communityAccentColorLight: pub.community.accentColorLight,
				communityAccentColorDark: pub.community.accentColorDark,
				communityHeaderLogo: pub.community.headerLogo,
				communityHeaderColorType: pub.community.headerColorType,
				communityUseHeaderTextAccent: pub.community.useHeaderTextAccent,
				branchId: branch.id,
				branchShortId: branch.shortId,
				branchAccessIds: accessIds,
				branchIsPublic: branch.title === 'public',
				branchCreatedAt: branch.createdAt,
				branchContent: undefined,
			};
			branchesToSync.push(data);
		});
	}

	const dataToSync = [];
	const branchDocDataList = await Promise.all(
		branchesToSync.map((branchData) => {
			return getBranchDoc(branchData.pubId, branchData.branchId).catch((err) => {
				console.error(
					`Error with pub:${branchData.pubId} branch:${branchData.branchId}. ${err.message}`,
				);
				return null;
			});
		}),
	);
	branchesToSync.forEach((branchData, index) => {
		const branchDocData = branchDocDataList[index];
		if (branchDocData && branchDocData.doc) {
			jsonToTextChunks(branchDocData.doc).forEach((textChunk) => {
				dataToSync.push({
					...branchData,
					branchContent: textChunk,
				});
			});
		}
	});
	return dataToSync;
};

export const getPageSearchData = async (pageIds) => {
	const pages = await Page.findAll({
		where: {
			id: pageIds,
		},
		include: [
			{
				model: Community,
				as: 'community',
			},
		],
	});
	const dataToSync = [];
	for (let index = 0; index < pages.length; index++) {
		const page = pages[index];
		// eslint-disable-next-line no-await-in-loop
		const scopeData = await getScope({ communityId: page.community.id });
		// eslint-disable-next-line no-await-in-loop
		const { members } = await getMembers({ scopeData: scopeData });
		const accessIds = members.map((member) => {
			return member.userId;
		});
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
			pageAccessIds: accessIds,
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
	}

	return dataToSync;
};
