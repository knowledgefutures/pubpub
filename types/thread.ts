import { User } from './attribution';
import { Discussion } from './discussion';
import { Review } from './review';

export type ThreadComment = {
	id: string;
	createdAt: string;
	updatedAt: string;
	text: string;
	content: {};
	userId: string;
	threadId: string;
	author?: User;
};

export type Thread = {
	id: string;
	createdAt: string;
	updatedAt: string;
	locked?: boolean;
	comments: ThreadComment[];
};

export type TaggedThreadParent<T = {}> =
	| { type: 'discussion'; value: T & Discussion }
	| { type: 'review'; value: T & Review };
