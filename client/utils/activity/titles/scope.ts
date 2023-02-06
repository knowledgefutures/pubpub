import { FacetsActivityItem, MemberActivityItem } from 'types';

import { TitleRenderer } from '../types';
import { collectionTitle } from './collection';
import { communityTitle } from './community';
import { pubTitle } from './pub';

type AcceptedItem = MemberActivityItem | FacetsActivityItem;

export const scopeTitle: TitleRenderer<AcceptedItem> = (item, context) => {
	const { pubId, collectionId, communityId } = item;
	if (typeof pubId === 'string') {
		return pubTitle({ ...item, pubId }, context);
	}
	if (typeof collectionId === 'string') {
		return collectionTitle({ ...item, collectionId }, context);
	}
	return communityTitle({ ...item, communityId }, context);
};
