import { Scope } from '../scope';

import { CommunityActivityItem } from './community';
import { CollectionActivityItem } from './collection';
import { PubActivityItem } from './pub';
import { MemberActivityItem } from './member';
import { ActivityAssociations } from './associations';

export * from './community';
export * from './collection';
export * from './pub';
export * from './member';

export type InsertableActivityItem =
	| CommunityActivityItem
	| CollectionActivityItem
	| PubActivityItem
	| MemberActivityItem;

export type ActivityItem = InsertableActivityItem & {
	id: string;
	createdAt: string;
	updatedAt: string;
	timestamp: string;
};

export type ActivityItemKind = ActivityItem['kind'];
export {
	ActivityAssociationIds,
	ActivityAssociations,
	ActivityAssociationType,
	activityAssociationTypes,
	ActivityAssociationModels,
} from './associations';

export type ActivityItemsFetchResult = {
	activityItems: ActivityItem[];
	associations: ActivityAssociations;
	fetchedAllItems: boolean;
};

export type ActivityItemsRenderContext = ActivityItemsFetchResult & {
	scope: Scope;
};

export { ActivityFilter } from './filters';
