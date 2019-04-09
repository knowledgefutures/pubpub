import { pubUrl } from 'shared/util/canonicalUrls';

import transformAttributions from './attributions';

export default ({ globals, community }) => (pub) => {
	const { timestamp, dois } = globals;
	const { title } = pub;
	const sortedVersions = pub.versions.sort((a, b) => a.createdAt - b.createdAt);
	const publicationDate = new Date(sortedVersions[0].createdAt);
	return {
		title: title,
		timestamp: timestamp,
		sortedVersions: sortedVersions,
		publicationDate: publicationDate,
		attributions: transformAttributions(pub.attributions),
		getResourceUrl: (version) => pubUrl(community, pub, version),
		doi: dois.pub,
		getVersionDoi: dois.getPubVersionDoi,
	};
};
