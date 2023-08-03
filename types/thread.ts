import { DocJson } from 'types';
import { User } from './user';
import { Discussion } from './discussion';
import { Review } from './review';

export type Commenter = {
	id: string;
	name: string;
};

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
	content: DocJson;
	userId: null | string;
	threadId: string;
	commenterId: null | string;
	author?: null | User;
	commenter?: null | Commenter;
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
