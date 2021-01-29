import stopword from 'stopword';

import {
	Pub,
	Community,
	PubAttribution,
	Page,
	Release,
	Doc,
	includeUserModel,
} from 'server/models';
import { getPubDraftDoc } from 'server/utils/firebaseAdmin';
import { getScope, getMembers } from 'server/utils/queryHelpers';
import { getAuthorString } from 'utils/contributors';
import { DefinitelyHas, Release as ReleaseType, Pub as PubType } from 'utils/types';

import stopWordList from './stopwords';

type AlgoliaPubEntry = {
	pubId: string;
	title: string;
	slug: string;
	avatar: string;
	description: string;
	byline: string;
	customPublishedAt: string;
	communityId: string;
	communityDomain: string;
	communityTitle: string;
	communityAccentColorLight: string;
	communityAccentColorDark: string;
	communityHeaderLogo: string;
	communityHeaderColorType: string;
	communityUseHeaderTextAccent: boolean;
	userIdsWithAccess: string;
	isPublic: boolean;
	content: string[];
} & ({ isPublic: false; userIdsWithAccess: string[] } | { isPublic: true });

type SearchPub = DefinitelyHas<PubType, 'attributions' | 'community'> & {
	releases: DefinitelyHas<ReleaseType, 'doc'>[];
};

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

const createSearchDataForPub = async (pub: SearchPub): Promise<AlgoliaPubEntry[]> => {
	const {
		releases: [release],
		community,
	} = pub;
	const entries: AlgoliaPubEntry[] = [];
	const scopeData = await getScope({ pubId: pub.id, communityId: pub.community.id });
	const { members } = await getMembers({ scopeData: scopeData });
	const userIdsWithAccess = members.map((m) => m.userId);
	const authorByline = getAuthorString(pub);
	const sharedFields = {
		pubId: pub.id,
		title: pub.title,
		slug: pub.slug,
		avatar: pub.avatar!,
		description: pub.description!,
		byline: authorByline ? `by ${authorByline}` : '',
		customPublishedAt: pub.customPublishedAt!,
		communityId: community.id,
		communityDomain: community.domain || `${community.subdomain}.pubpub.org`,
		communityTitle: community.title,
		communityAccentColorLight: community.accentColorLight!,
		communityAccentColorDark: community.accentColorDark!,
		communityHeaderLogo: community.headerLogo!,
		communityHeaderColorType: community.headerColorType!,
		communityUseHeaderTextAccent: community.useHeaderTextAccent!,
		userIdsWithAccess: userIdsWithAccess,
	};
	if (release) {
		entries.push({
			...sharedFields,
			isPublic: true,
			content: jsonToTextChunks(release.doc.content),
		});
	}
	const { doc } = await getPubDraftDoc(pub.id);
	entries.push({
		...sharedFields,
		isPublic: false,
		userIdsWithAccess: userIdsWithAccess,
		content: jsonToTextChunks(doc),
	});
	return entries;
};

export const getPubSearchData = async (pubIds) => {
	const pubs: SearchPub[] = await Pub.findAll({
		where: { id: pubIds },
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
				model: Release,
				as: 'releases',
				separate: true,
				include: [{ model: Doc, as: 'doc' }],
				order: [['historyKey', 'DESC']],
				limit: 1,
			},
		],
	});
	const resultsByPub = await Promise.all(pubs.map(createSearchDataForPub));
	return resultsByPub.reduce((a, b) => [...a, ...b], []);
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
						// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
						content: textChunk,
					});
				});
			});
		if (!hasContent) {
			// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ pageId: any; title: any; slug:... Remove this comment to see the full error message
			dataToSync.push(data);
		}
	}

	return dataToSync;
};
