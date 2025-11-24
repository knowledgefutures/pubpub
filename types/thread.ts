import type {
	ThreadComment as ThreadCommentModel,
	ThreadEvent as ThreadEventModel,
	Thread as ThreadModel,
} from 'server/models';

import type { Discussion } from './discussion';
import type { Review } from './review';
import type { SerializedModel } from './serializedModel';

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
