import type * as types from 'types';

import { Op } from 'sequelize';

import { CollectionPub, Pub } from 'server/models';

/**
 * Retrieves the next CollectionPub in a collection based on the current rank
 *
 * @param collectionPub - The current CollectionPub
 * @returns The next CollectionPub, or null if there is no next publication.
 */
export const getNextCollectionPub = async (collectionPub: types.CollectionPub | CollectionPub) => {
	const { rank: currentRank, collectionId } = collectionPub;

	const nextCollectionPub = (await CollectionPub.findOne({
		where: {
			rank: {
				[Op.gt]: currentRank,
			},
			collectionId,
		},
		order: [['rank', 'ASC']],
		include: [
			{
				model: Pub,
				as: 'pub',
			},
		],
	})) as types.DefinitelyHas<CollectionPub, 'pub'> | null;

	return nextCollectionPub;
};
