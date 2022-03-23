import { Node, Schema } from 'prosemirror-model';
import { Plugin, EditorState, Transaction } from 'prosemirror-state';
import firebase from 'firebase';

import { NoteManager } from 'client/utils/notes';
import SuggestionManager from 'client/utils/suggestions/suggestionManager';
import { DiscussionAnchor } from 'types';

import { getChangeObject } from './plugins/onChange';
import { NodeReference } from './utils';

export enum ReferenceableNodeType {
	Image = 'image',
	Video = 'video',
	Audio = 'audio',
	Table = 'table',
	BlockEquation = 'block_equation',
}

export const referenceableNodeTypes = Object.values(ReferenceableNodeType);

export type NodeLabel = {
	enabled: boolean;
	text: string;
};

export type NodeLabelMap = Record<ReferenceableNodeType, NodeLabel>;

export type PluginLoader = (schema: Schema, options: PluginsOptions) => Plugin | Plugin[];

export type EditorChangeObject = ReturnType<typeof getChangeObject>;

export type CollaborativeOptions = {
	clientData: {
		id: string;
	};
	firebaseRef: firebase.database.Reference;
	initialDocKey: number;
	onStatusChange?: (status: 'saving' | 'saved') => unknown;
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
	collaborativeOptions?: CollaborativeOptions;
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
