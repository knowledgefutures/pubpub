import { ActivityItem as ActivityItemModel } from 'server/models';

import { ScopeId } from '../scope';

import { CommunityActivityItem } from './community';
import { CollectionActivityItem } from './collection';
import { FacetsActivityItem } from './facets';
import { PageActivityItem } from './page';
import { PubActivityItem } from './pub';
import { MemberActivityItem } from './member';
import { ActivityAssociations } from './associations';
import { SubmissionActivityItem } from './submission';
import { SerializedModel } from '../serializedModel';

export * from './community';
export * from './collection';
export * from './facets';
export * from './page';
export * from './pub';
export * from './member';
export * from './submission';

export type InsertableActivityItem =
	| CommunityActivityItem
	| CollectionActivityItem
	| FacetsActivityItem
	| PageActivityItem
	| PubActivityItem
	| MemberActivityItem
	| SubmissionActivityItem;

export type ActivityItemKind = InsertableActivityItem['kind'];
export type ActivityItemPayload = InsertableActivityItem['payload'];

export type ActivityItem<T extends InsertableActivityItem = InsertableActivityItem> =
	SerializedModel<ActivityItemModel<T>>;

export type ActivityItemOfKind<Kind extends ActivityItemKind> = ActivityItem<
	InsertableActivityItem & { kind: Kind }
>;

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
