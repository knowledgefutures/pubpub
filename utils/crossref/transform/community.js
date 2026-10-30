import { canonicalCommunityUrl as communityUrl } from 'utils/canonicalUrls';

import normalizeIssn from './issn';

const getLanguageForCommunity = () => 'en';

export default ({ globals }) =>
	(community, collection) => {
		const { title, issn, citeAs } = community;
		const kind = collection?.kind || '';
		return {
			title,
			issn: normalizeIssn(issn),
			citeAs,
			kind,
			timestamp: globals.timestamp,
			language: getLanguageForCommunity(community),
			doi: globals.dois.community,
			url: communityUrl(community),
		};
	};
