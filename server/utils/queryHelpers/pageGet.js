import { Page, Pub } from '../../models';
import buildPubOptions from './pubOptions';
import sanitizePub from './pubSanitize';

export default async ({ id, slug }, initialData) => {
	const whereClause = {
		...(id && { id: id }),
		...(slug && { slug: slug }),
		communityId: initialData.communityData.id,
	};
	const pageQuery = Page.findOne({
		where: whereClause,
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
