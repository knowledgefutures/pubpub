import { Diff } from '../util';

import { InsertableActivityItemBase } from './util';

type CollectionActivityItemBase = InsertableActivityItemBase & {
	collectionId: string;
	payload: {
		collection: {
			title: string;
		};
	};
};

export type CollectionCreatedActivityItem = CollectionActivityItemBase & {
	kind: 'collection-created';
};

export type CollectionUpdatedActivityItem = CollectionActivityItemBase & {
	kind: 'collection-updated';
	payload: {
		isPublic?: Diff<boolean>;
		isRestricted?: Diff<boolean>;
		title?: Diff<string>;
		layout?: true;
		metadata?: true;
	};
};

export type CollectionRemovedActivityItem = CollectionActivityItemBase & {
	kind: 'collection-removed';
};

type CollectionPubActivityItemBase = CollectionActivityItemBase & {
	pubId: string;
	payload: {
		collectionPubId: string;
		pub: {
			title: string;
		};
	};
};

export type CollectionPubCreatedActivityItem = CollectionPubActivityItemBase & {
	kind: 'collection-pub-created';
};

export type CollectionPubRemovedActivityItem = CollectionPubActivityItemBase & {
	kind: 'collection-pub-removed';
};

export type CollectionActivityItem =
	| CollectionCreatedActivityItem
	| CollectionUpdatedActivityItem
	| CollectionRemovedActivityItem
	| CollectionPubCreatedActivityItem
	| CollectionPubRemovedActivityItem;
