import { Visibility } from './visibility';
import { Thread } from './thread';
import { Pub } from './pub';

export type DiscussionAnchor = {
	id: string;
	discussionId: string;
	historyKey: number;
	selection: null | { type: 'text'; anchor: number; head: number };
	originalText: string;
	originalTextPrefix: string;
	originalTextSuffix: string;
	isOriginal: boolean;
};

export type Discussion = {
	id: string;
	title: string;
	number: number;
	isClosed: boolean;
	labels: string[];
	threadId: string;
	visibilityId: string;
	userId: string;
	pubId: string;
	anchors?: DiscussionAnchor[];
	visibility: Visibility;
	thread?: Thread;
	pub?: Pub;
};
