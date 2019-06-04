import { pubUrlV5 } from 'shared/utils/canonicalUrls';
import { getPubPublishedDate } from 'shared/utils/pubDates';

import transformAttributions from './attributions';

export default ({ globals, community }) => (pub) => {
	const { timestamp, dois } = globals;
	const { title } = pub;
	const publicationDate = getPubPublishedDate(pub);
	return {
		title: title,
		timestamp: timestamp,
		publicationDate: publicationDate,
		attributions: transformAttributions(pub.attributions),
		getResourceUrl: (version) => pubUrlV5(community, pub, version),
		doi: dois.pub,
	};
};
