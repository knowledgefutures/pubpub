import { Pub } from 'server/models';

import buildPubOptions from './pubOptions';

export default async (slug, communityId, options = {}) => {
	const sanitizedSlug = slug.toLowerCase();
	const pubData = await Pub.findOne({
		where: {
			slug: sanitizedSlug,
			communityId: communityId,
		},
		...buildPubOptions({ getMembers: true, getCollections: true, getEdges: true, ...options }),
	});

	if (!pubData) {
		throw new Error('Pub Not Found');
	}
	return pubData.toJSON();
};
