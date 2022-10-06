import { ScopeId } from '../scope';

import { CommunityActivityItem } from './community';
import { CollectionActivityItem } from './collection';
import { PageActivityItem } from './page';
import { PubActivityItem } from './pub';
import { MemberActivityItem } from './member';
import { ActivityAssociations } from './associations';
import { SubmissionActivityItem } from './submission';

export * from './community';
export * from './collection';
export * from './page';
export * from './pub';
export * from './member';
export * from './submission';

export type InsertableActivityItem =
	| CommunityActivityItem
	| CollectionActivityItem
	| PageActivityItem
	| PubActivityItem
	| MemberActivityItem
	| SubmissionActivityItem;

export type ActivityItem = InsertableActivityItem & {
	id: string;
	createdAt: string;
	updatedAt: string;
	timestamp: string;
};

export type ActivityItemKind = ActivityItem['kind'];
export type ActivityItemOfKind<Kind extends ActivityItemKind> = ActivityItem & { kind: Kind };

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
	scope: ScopeId;
};

export { ActivityFilter } from './filters';
