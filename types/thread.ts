import { Discussion } from './discussion';
import { Review } from './review';

export type ThreadComment = {
	id: string;
	text: string;
	content: {};
	userId: string;
	threadId: string;
};

export type Thread = {
	id: string;
	updatedAt: string;
	createdAt: string;
	locked?: boolean;
	comments: ThreadComment[];
};

export type TaggedThreadParent<T = {}> =
	| { type: 'discussion'; value: T & Discussion }
	| { type: 'review'; value: T & Review };
