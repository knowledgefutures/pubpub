import {
	Visibility as VisibilityModel,
	VisibilityUser as VisibilityUserModel,
} from 'server/models';
import { SerializedModel } from './serializedModel';
import { Discussion } from './discussion';
import { Review } from './review';

export type VisibilityAccess = 'private' | 'members' | 'public';

export type VisibilityUser = SerializedModel<VisibilityUserModel>;

export type Visibility = SerializedModel<VisibilityModel>;

export type TaggedVisibilityParent =
	| { type: 'discussion'; value: Discussion }
	| { type: 'review'; value: Review };
