import { Diff } from '../util';

import { InsertableActivityItemBase } from './base';

type PageActivityItemBase = InsertableActivityItemBase & {
	payload: {
		page: {
			id: string;
			title: string;
		};
	};
};

export type PageCreatedActivityItem = PageActivityItemBase & {
	kind: 'page-created';
};

export type PageUpdatedActivityItem = PageActivityItemBase & {
	kind: 'page-updated';
	payload: {
		title?: Diff<string>;
		slug?: Diff<string>;
		description?: Diff<null | string>;
		isPublic?: Diff<boolean>;
		layout?: true;
	};
};

export type PageRemovedActivityItem = PageActivityItemBase & {
	kind: 'page-removed';
};

export type PageActivityItem =
	| PageCreatedActivityItem
	| PageUpdatedActivityItem
	| PageRemovedActivityItem;
