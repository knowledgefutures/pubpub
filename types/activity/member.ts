import { Diff } from '../util';
import { MemberPermission } from '../member';

import { InsertableActivityItemBase } from './base';

type Scoped<T> =
	| { communityId: string; payload: { community: T } }
	| { collectionId: string; payload: { collection: T } }
	| { pubId: string; payload: { pub: T } };

type MemberActivityItemBase = InsertableActivityItemBase &
	Scoped<{ title: string }> & {
		payload: {
			userId: string;
		};
	};

export type MemberCreatedActivityItem = MemberActivityItemBase & {
	kind: 'member-created';
	payload: {
		permissions: MemberPermission;
	};
};

export type MemberUpdatedActivityItem = MemberActivityItemBase & {
	kind: 'member-updated';
	payload: {
		permissions?: Diff<MemberPermission>;
	};
};

export type MemberRemovedActivityItem = MemberActivityItemBase & {
	kind: 'member-removed';
};

export type MemberActivityItem =
	| MemberCreatedActivityItem
	| MemberUpdatedActivityItem
	| MemberRemovedActivityItem;
