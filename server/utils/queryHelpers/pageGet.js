import { Page, Pub } from '../../models';
import buildPubOptions from './pubOptions';
import sanitizePub from './pubSanitize';

export default async (pageId, initialData) => {
	const pageQuery = Page.findOne({
		where: { id: pageId },
	});
	const pubsQuery = Pub.findAll({
		where: { communityId: initialData.communityData.id },
		...buildPubOptions({ isPreview: true, getCollections: true }),
	});
	const [pageData, pubsData] = await Promise.all([pageQuery, pubsQuery]);
	const sanitizedPubs = pubsData
		.map((pub) => sanitizePub(pub.toJSON(), initialData))
		.filter((pub) => !!pub);

	return {
		...pageData.toJSON(),
		pubs: sanitizedPubs,
	};
};
