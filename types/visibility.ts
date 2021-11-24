import { Discussion } from './discussion';
import { Review } from './review';

export type VisibilityAccess = 'private' | 'members' | 'public';

export type VisibilityUser = {
	id: string;
	visibilityId: string;
	userId: string;
};

export type Visibility = {
	id: string;
	access: VisibilityAccess;
	users: VisibilityUser[];
};

export type TaggedVisibilityParent =
	| { type: 'discussion'; value: Discussion }
	| { type: 'review'; value: Review };
