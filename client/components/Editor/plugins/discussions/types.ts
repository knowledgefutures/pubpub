import { Node } from 'prosemirror-model';
import { Mapping } from 'prosemirror-transform';
import { Decoration } from 'prosemirror-view';

export type Range = { from: number; to: number };

export type DiscussionSelection = { type: 'text'; anchor: number; head: number };

export type DiscussionInfo = {
	currentKey: number;
	initKey: number;
	initHead: number;
	initAnchor: number;
	selection: null | DiscussionSelection;
};

export type CompressedDiscussionInfo = {
	currentKey: number;
	initKey: number;
	initHead: number;
	initAnchor: number;
	selection: null | { t: 'text'; a: number; h: number };
};

export type Discussions = Record<string, DiscussionInfo>;
export type NullableDiscussions = Record<string, null | DiscussionInfo>;

export type DiscussionsHandler = (discussionsById: NullableDiscussions) => unknown;

export type DiscussionsFastForwardFn = (
	discussions: NullableDiscussions,
	fromDoc: Node,
	fromKey: number,
) => Promise<Discussions>;

export type DiscussionsStateTransition = {
	currentDoc: Node;
	currentHistoryKey: number;
	previousDoc: Node;
	previousHistoryKey: number;
};

export type DiscussionsUpdateResult = {
	addedDiscussionIds: Set<string>;
	removedDiscussionIds: Set<string>;
	discussions: Discussions;
	doc: Node;
	mapping: Mapping;
};

export type RemoteDiscussions = {
	sendDiscussions: (discussions: Discussions) => void;
	receiveDiscussions: (handler: DiscussionsHandler) => void;
	disconnect: () => void;
};

export type DiscussionDecoration = Decoration;

/*
export type DiscussionDecoration = Decoration<{
	key: string;
	widgetForDiscussionId?: string;
}>;
*/
