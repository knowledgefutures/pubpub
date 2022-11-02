import { InitialData, PubGetOptions } from 'types';
import { Pub } from 'server/models';
import { fetchFacetsForScope } from 'server/facets';

import sanitizePub from './pubSanitize';
import buildPubOptions from './pubOptions';

type GetPubWhere = { slug: string; communityId: string } | { id: string };

const resolveGetPubWhereQuery = (where: GetPubWhere): GetPubWhere => {
	if ('slug' in where) {
		return {
			communityId: where.communityId,
			slug: where.slug.toLowerCase(),
		};
	}
	return { id: where.id };
};

const getFacetsForPub = async (options: PubGetOptions, where: GetPubWhere) => {
	if (options.getFacets) {
		const pubId =
			'id' in where
				? where.id
				: (await Pub.findOne({ where, attributes: ['slug', 'communityId', 'id'] })).id;
		return { facets: await fetchFacetsForScope({ kind: 'pub', id: pubId }) };
	}
	return null;
};

export const getPub = async (where: GetPubWhere, options: PubGetOptions = {}) => {
	where = resolveGetPubWhereQuery(where);
	const [pubData, facets] = await Promise.all([
		Pub.findOne({
			where,
			...buildPubOptions({
				getMembers: true,
				getCollections: true,
				getExports: true,
				getEdges: 'approved-only',
				...options,
			}),
		}),
		getFacetsForPub(options, where),
	]);

	if (!pubData) {
		throw new Error('Pub Not Found');
	}
	return { ...pubData.toJSON(), ...facets };
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
