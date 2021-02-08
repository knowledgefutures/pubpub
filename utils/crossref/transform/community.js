import { communityUrl } from 'utils/canonicalUrls';

const getLanguageForCommunity = () => 'en';

export default ({ globals }) => (community) => {
	const { title, issn: denormalizedIssn } = community;
	const issn = denormalizedIssn && denormalizedIssn.replace('-', '');
	return {
		title,
		issn,
		timestamp: globals.timestamp,
		language: getLanguageForCommunity(community),
		doi: globals.dois.community,
		url: communityUrl(community),
	};
};
