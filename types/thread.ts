import { User } from './user';
import { Discussion } from './discussion';
import { Review } from './review';

export type ThreadEvent = {
	id: string;
	type?: string;
	data?: {};
	userId: string;
	threadId: string;
};

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
	events: ThreadEvent[];
};

export type TaggedThreadParent<T = {}> =
	| { type: 'discussion'; value: T & Discussion }
	| { type: 'review'; value: T & Review };
