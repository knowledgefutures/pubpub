import type * as types from 'types';
import type { InitialData, PubGetOptions, SanitizedPubData } from 'types';

import { fetchFacetsForScope } from 'server/facets';
import { Pub } from 'server/models';
import { expect } from 'utils/assert';

import { createLogger } from './communityGet';
import buildPubOptions from './pubOptions';
import sanitizePub from './pubSanitize';

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
				: expect(
						await Pub.findOne({
							where,
							attributes: ['slug', 'communityId', 'id'],
						}),
					).id;
		return { facets: await fetchFacetsForScope({ kind: 'pub', id: pubId }) };
	}
	return null;
};

export const getPub = async (where: GetPubWhere, options: PubGetOptions = {}) => {
	where = resolveGetPubWhereQuery(where);
	const { log, end } = createLogger('getPub');
	const pubPromise = Pub.findOne({
		where,
		...buildPubOptions({
			getMembers: true,
			getCollections: true,
			getExports: true,
			getEdges: 'approved-only',
			...options,
		}),
		// logging: (sql, ms) => console.log(`[pubget SQL ${ms}ms] `, sql),
	}) as Promise<types.DefinitelyHas<Pub, 'members' | 'exports' | 'collectionPubs'> | null>;

	const facetsPromise = getFacetsForPub(options, where);

	const [pubData, facets] = await Promise.all([
		log('pubPromise', pubPromise),
		log('facetsPromise', facetsPromise),
	]);

	end();

	if (!pubData) {
		throw new Error('Pub Not Found');
	}
	return { ...pubData.toJSON(), ...facets };
};

type GetPubForRequestOptions = PubGetOptions & {
	slug: string;
	initialData: InitialData;
	releaseNumber?: number | null;
	isAVisitingCommenter?: boolean;
};

export const getPubForRequest = async (options: GetPubForRequestOptions) => {
	const { slug, initialData, releaseNumber = null, ...pubGetOptions } = options;
	const communityId = initialData.communityData.id;
	const { log, end } = createLogger('getPubForRequest');

	const pubData = await log('getPub', getPub({ slug, communityId }, pubGetOptions));

	const sanitized = await log(
		'sanitizePub',
		new Promise<null | SanitizedPubData>((resolve) => {
			resolve(sanitizePub(pubData, initialData, releaseNumber));
		}),
	);

	end();

	return sanitized;
};
