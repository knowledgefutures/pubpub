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

export type * from './community';
export type * from './collection';
export type * from './facets';
export type * from './page';
export type * from './pub';
export type * from './member';
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
	type ActivityAssociations,
	type ActivityAssociationType,
	activityAssociationTypes,
	type ActivityAssociationModels,
} from './associations';

export type ActivityItemsFetchResult = {
	activityItems: ActivityItem[];
	associations: ActivityAssociations;
	fetchedAllItems: boolean;
};

export type ActivityItemsRenderContext = ActivityItemsFetchResult & {
	scope: ScopeId;
};

export { type ActivityFilter } from './filters';
