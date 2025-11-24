import type firebase from 'firebase';
import type { Node, Schema } from 'prosemirror-model';
import type { EditorState, Plugin, Transaction } from 'prosemirror-state';

import type { NoteManager } from 'client/utils/notes';
import type SuggestionManager from 'client/utils/suggestions/suggestionManager';
import type { DiscussionAnchor } from 'types';

import type { getChangeObject } from './plugins/onChange';
import type { NodeReference } from './utils';

export enum ReferenceableNodeType {
	Image = 'image',
	Video = 'video',
	Audio = 'audio',
	Table = 'table',
	Math = 'math',
	Iframe = 'iframe',
}

export const referenceableNodeTypes = Object.values(ReferenceableNodeType);

export type NodeLabel = {
	enabled: boolean;
	text: string;
};

export type NodeLabelMap = Record<ReferenceableNodeType, NodeLabel>;

export type PluginLoader = (schema: Schema, options: PluginsOptions) => Plugin | Plugin[];

export type EditorChangeObject = ReturnType<typeof getChangeObject>;

export type CollaborativeEditorStatus =
	| 'disconnected'
	| 'connecting'
	| 'connected'
	| 'saving'
	| 'saved';

export type CollaborativeOptions = {
	clientData: {
		id: null | string;
	};
	firebaseRef: firebase.database.Reference;
	initialDocKey: number;
	onStatusChange?: (status: CollaborativeEditorStatus) => unknown;
	onUpdateLatestKey?: (key: number) => unknown;
};

export type DiscussionsOptions = {
	draftRef?: null | firebase.database.Reference;
	initialHistoryKey: number;
	discussionAnchors: DiscussionAnchor[];
};

export type MediaUploadInstance = {
	id: string;
	start: (callbacks: {
		onFinish: (src: string) => unknown;
		onProgress: (progress: number) => unknown;
		onFailure: () => unknown;
	}) => unknown;
};
export type MediaUploadHandler = (file: File) => null | MediaUploadInstance;

export type PluginsOptions = {
	noteManager?: NoteManager;
	collaborativeOptions?: null | CollaborativeOptions;
	discussionsOptions?: null | DiscussionsOptions;
	initialDoc: Node;
	isReadOnly?: boolean;
	nodeLabels: NodeLabelMap;
	onChange?: (changeObject: EditorChangeObject) => unknown;
	onError?: (error: Error) => unknown;
	placeholder?: string;
	suggestionManager: SuggestionManager<NodeReference>;
	mediaUploadHandler?: MediaUploadHandler;
};

export type OnEditFn = (
	doc: Node,
	tr: Transaction,
	newState: EditorState,
	oldState: EditorState,
) => unknown;

export type CompressedChange = {
	s: Record<string, any>[];
	t: { '.sv': string }; // This is a special Firebase value
	cId: string;
	id: string;
};

export type CompressedKeyable = CompressedChange | CompressedChange[];
