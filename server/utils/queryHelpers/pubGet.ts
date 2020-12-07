import { Pub } from 'server/models';

import buildPubOptions from './pubOptions';

export default async (slug, communityId, options = {}) => {
	const sanitizedSlug = slug.toLowerCase();
	const pubData = await Pub.findOne({
		where: {
			slug: sanitizedSlug,
			communityId: communityId,
		},
		// @ts-expect-error ts-migrate(2322) FIXME: Type 'true' is not assignable to type 'string | un... Remove this comment to see the full error message
		...buildPubOptions({ getMembers: true, getCollections: true, getEdges: true, ...options }),
	});

	if (!pubData) {
		throw new Error('Pub Not Found');
	}
	return pubData.toJSON();
};
