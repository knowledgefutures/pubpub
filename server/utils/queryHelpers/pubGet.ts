import { Pub } from 'server/models';
import { InitialData, PubGetOptions } from 'types';

import sanitizePub from './pubSanitize';
import buildPubOptions from './pubOptions';

type GetPubWhere = { slug: string; communityId: string } | { id: string };

const resolveGetPubWhereQuery = (where: GetPubWhere) => {
	if ('slug' in where) {
		return {
			communityId: where.communityId,
			slug: where.slug.toLowerCase(),
		};
	}
	return { id: where.id };
};

export const getPub = async (where: GetPubWhere, options: PubGetOptions = {}) => {
	const pubData = await Pub.findOne({
		where: resolveGetPubWhereQuery(where),
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
	const communityId = initialData.communityData.id;
	const pubData = await getPub({ slug, communityId }, pubGetOptions);
	return sanitizePub(pubData, initialData, releaseNumber);
};
