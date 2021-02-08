import { Pub } from 'server/models';
import { InitialData } from 'utils/types';

import sanitizePub from './pubSanitize';
import buildPubOptions, { PubGetOptions } from './pubOptions';

export const getPub = async (slug: string, communityId: string, options: PubGetOptions = {}) => {
	const sanitizedSlug = slug.toLowerCase();
	const pubData = await Pub.findOne({
		where: {
			slug: sanitizedSlug,
			communityId,
		},
		...buildPubOptions({
			getMembers: true,
			getCollections: true,
			getExports: true,
			getEdges: 'approved-only',
			...options,
		}),
	});

	if (!pubData) {
		throw new Error('Pub Not Found');
	}
	return pubData.toJSON();
};

type GetPubForRequestOptions = PubGetOptions & {
	slug: string;
	initialData: InitialData;
	releaseNumber?: number | null;
};

export const getPubForRequest = async (options: GetPubForRequestOptions) => {
	const { slug, initialData, releaseNumber = null, ...pubGetOptions } = options;
	const pubData = await getPub(slug, initialData.communityData.id, pubGetOptions);
	return sanitizePub(pubData, initialData, releaseNumber);
};
