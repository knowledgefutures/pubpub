import type { ActivityItem as ActivityItemModel } from 'server/models';

import type { ScopeId } from '../scope';
import type { SerializedModel } from '../serializedModel';
import type { ActivityAssociations } from './associations';
import type { CollectionActivityItem } from './collection';
import type { CommunityActivityItem } from './community';
import type { FacetsActivityItem } from './facets';
import type { MemberActivityItem } from './member';
import type { PageActivityItem } from './page';
import type { PubActivityItem } from './pub';
import type { SubmissionActivityItem } from './submission';

export type * from './collection';
export type * from './community';
export type * from './facets';
export type * from './member';
export type * from './page';
export type * from './pub';
export type * from './submission';

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
	type ActivityAssociationIds,
	type ActivityAssociationModels,
	type ActivityAssociations,
	type ActivityAssociationType,
	activityAssociationTypes,
} from './associations';

export type ActivityItemsFetchResult = {
	activityItems: ActivityItem[];
	associations: ActivityAssociations;
	fetchedAllItems: boolean;
};

export type ActivityItemsRenderContext = ActivityItemsFetchResult & {
	scope: ScopeId;
};

export type { ActivityFilter } from './filters';
