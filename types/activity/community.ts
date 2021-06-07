import { Diff } from '../util';

import { InsertableActivityItemBase } from './base';

type CommunityActivityItemBase = InsertableActivityItemBase & {
	payload: {
		community: {
			title: string;
		};
	};
};

export type CommunityCreatedActivityItem = CommunityActivityItemBase & {
	kind: 'community-created';
};

export type CommunityUpdatedActivityItem = CommunityActivityItemBase & {
	kind: 'community-updated';
	payload: {
		title?: Diff<string>;
	};
};

export type CommunityActivityItem = CommunityCreatedActivityItem | CommunityUpdatedActivityItem;
