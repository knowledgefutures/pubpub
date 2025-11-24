import type {
	Visibility as VisibilityModel,
	VisibilityUser as VisibilityUserModel,
} from 'server/models';

import type { Discussion } from './discussion';
import type { Review } from './review';
import type { SerializedModel } from './serializedModel';

export type VisibilityAccess = 'private' | 'members' | 'public';

export type VisibilityUser = SerializedModel<VisibilityUserModel>;

export type Visibility = SerializedModel<VisibilityModel>;

export type TaggedVisibilityParent =
	| { type: 'discussion'; value: Discussion }
	| { type: 'review'; value: Review };
