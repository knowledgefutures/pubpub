import { communityUrl } from 'utils/canonicalUrls';

const getLanguageForCommunity = () => 'en';

export default ({ globals }) => (community, collection) => {
	const { title, issn: denormalizedIssn, citeAs } = community;
	const kind = collection?.kind || '';
	const issn = denormalizedIssn && denormalizedIssn.replace('-', '');
	return {
		title,
		issn,
		citeAs,
		kind,
		timestamp: globals.timestamp,
		language: getLanguageForCommunity(community),
		doi: globals.dois.community,
		url: communityUrl(community),
	};
};
