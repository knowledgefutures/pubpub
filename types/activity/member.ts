import { Diff } from '../util';
import { MemberPermission } from '../member';

import { InsertableActivityItemBase } from './util';

type MemberActivityItemBase = InsertableActivityItemBase & {
	payload: {
		userId: string;
	};
};

export type MemberCreated = MemberActivityItemBase & {
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
	| MemberCreated
	| MemberUpdatedActivityItem
	| MemberRemovedActivityItem;
