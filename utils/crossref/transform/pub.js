import { pubUrl } from 'utils/canonicalUrls';
import { getPubPublishedDate } from 'utils/pub/pubDates';

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
		resourceUrl: pubUrl(community, pub),
		doi: dois.pub,
	};
};
