import {
	ThreadEvent as ThreadEventModel,
	ThreadComment as ThreadCommentModel,
	Thread as ThreadModel,
} from 'server/models';
import { SerializedModel } from './serializedModel';
import { Discussion } from './discussion';
import { Review } from './review';

export type Commenter = {
	id: string;
	name: string;
};

export type ThreadEvent = SerializedModel<ThreadEventModel>;

export type ThreadComment = SerializedModel<ThreadCommentModel>;

export type Thread = SerializedModel<ThreadModel>;

export type TaggedThreadParent<T = {}> =
	| { type: 'discussion'; value: T & Discussion }
	| { type: 'review'; value: T & Review };
