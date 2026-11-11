import { canonicalCommunityUrl as communityUrl } from 'utils/canonicalUrls';

import normalizeIssn from './issn';

const getLanguageForCommunity = () => 'en';

export default ({ globals }) =>
	(community, collection) => {
		const { title, electronicIssn, printIssn, citeAs } = community;
		const kind = collection?.kind || '';
		return {
			title,
			electronicIssn: normalizeIssn(electronicIssn),
			printIssn: normalizeIssn(printIssn),
			citeAs,
			kind,
			timestamp: globals.timestamp,
			language: getLanguageForCommunity(community),
			doi: globals.dois.community,
			url: communityUrl(community),
		};
	};
