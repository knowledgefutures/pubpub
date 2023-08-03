import chunkText from 'chunk-text';

import {
	Pub,
	Community,
	PubAttribution,
	Page,
	Release,
	Doc,
	includeUserModel,
} from 'server/models';
import { jsonToNode } from 'components/Editor';
import { getPubDraftDoc } from 'server/utils/firebaseAdmin';
import { getScope, getMembers } from 'server/utils/queryHelpers';
import { getAuthorString } from 'utils/contributors';
import { DefinitelyHas, Release as ReleaseType, Pub as PubType, DocJson } from 'types';

import { stopwords } from './stopwords';

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
	content: string | string[]; // Currently just `string` but historically either
} & ({ isPublic: false; userIdsWithAccess: string[] } | { isPublic: true });

type SearchPub = DefinitelyHas<PubType, 'attributions' | 'community'> & {
	releases: DefinitelyHas<ReleaseType, 'doc'>[];
};

const docJsonToTextChunks = (docJson: DocJson): string[] => {
	const { textContent } = jsonToNode(docJson);
	const contentWithoutStopwords = textContent
		.split(' ')
		.filter((x) => !stopwords.has(x))
		.join(' ');
	return chunkText(contentWithoutStopwords, 7500, {
		// Count each byte in every character
		charLengthMask: 0,
	});
};

const createSearchDataForPub = async (pub: SearchPub): Promise<AlgoliaPubEntry[]> => {
	const {
		releases: [release],
		community,
	} = pub;
	const entries: AlgoliaPubEntry[] = [];
	const scopeData = await getScope({ pubId: pub.id, communityId: pub.community.id });
	const { members } = await getMembers({ scopeData });
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
		userIdsWithAccess,
	};
	if (release) {
		const releaseContentChunks = docJsonToTextChunks(release.doc.content);
		releaseContentChunks.forEach((chunk) =>
			entries.push({
				...sharedFields,
				isPublic: true,
				content: chunk,
			}),
		);
	}
	const { doc } = await getPubDraftDoc(pub.id);
	const draftContentChunks = docJsonToTextChunks(doc);
	draftContentChunks.forEach((chunk) =>
		entries.push({
			...sharedFields,
			isPublic: false,
			userIdsWithAccess,
			content: chunk,
		}),
	);
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
	const dataToSync: any[] = [];
	for (let index = 0; index < pages.length; index++) {
		const page = pages[index];
		// eslint-disable-next-line no-await-in-loop
		const scopeData = await getScope({ communityId: page.community.id });
		// eslint-disable-next-line no-await-in-loop
		const { members } = await getMembers({ scopeData });
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
				docJsonToTextChunks(block.content.text).forEach((textChunk) => {
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
