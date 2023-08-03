import { Visibility } from './visibility';
import { Thread } from './thread';
import { Pub } from './pub';
import { DocJson } from './doc';
import { User } from './user';

export type Review = {
	id: string;
	author: User;
	createdAt: string;
	updatedAt: string;
	title: string;
	number: number;
	status: 'open' | 'closed' | 'completed';
	releaseRequested: boolean;
	threadId: string;
	thread: Thread;
	visibilityId: string;
	visibility?: Visibility;
	userId: string;
	pubId: string;
	pub?: Pub;
	reviewContent?: DocJson;
	reviewers?: Reviewer[];
};

export type Reviewer = {
	id: string;
	name: string;
};
