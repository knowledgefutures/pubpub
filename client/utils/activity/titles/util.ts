import { ActivityAssociations, ActivityAssociationType } from 'types';

import { ActivityRenderContext } from '../types';

const createContextAssociationRetriever =
	<T extends ActivityAssociationType, I extends string = string>(association: T) =>
	(itemId: I, context: ActivityRenderContext): null | ActivityAssociations[T][I] => {
		const {
			associations: {
				[association]: { [itemId]: item },
			},
		} = context;
		if (item) {
			return item;
		}
		return null;
	};

export const getCommunityFromContext = createContextAssociationRetriever('community');
export const getCollectionFromContext = createContextAssociationRetriever('collection');
export const getPubFromContext = createContextAssociationRetriever('pub');
export const getPubEdgeFromContext = createContextAssociationRetriever('pubEdge');
export const getReviewFromContext = createContextAssociationRetriever('review');
export const getUserFromContext = createContextAssociationRetriever('user');
