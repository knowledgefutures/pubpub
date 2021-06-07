import { CommunityActivityItem } from './community';
import { CollectionActivityItem } from './collection';
import { PubActivityItem } from './pub';
import { MemberActivityItem } from './member';

export type InsertableActivityItem =
	| CommunityActivityItem
	| CollectionActivityItem
	| PubActivityItem
	| MemberActivityItem;

export type ActivityItem = InsertableActivityItem & {
	id: string;
	createdAt: string;
	updatedAt: string;
};

export {
	ActivityAssociationIds,
	ActivityAssociations,
	ActivityAssociationType,
	activityAssociationTypes,
	ActivityItemsContext,
} from './associations';
