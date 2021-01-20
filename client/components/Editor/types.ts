import { Reference } from '@firebase/database-types';
import { Node, Schema } from 'prosemirror-model';
import { Plugin, EditorState, Transaction } from 'prosemirror-state';

import { CitationManager } from 'client/utils/citations/citationManager';
import SuggestionManager from 'client/utils/suggestions/suggestionManager';

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
	firebaseRef?: Reference;
	initialDocKey: number;
	onStatusChange?: (status: 'saving' | 'saved') => unknown;
	onUpdateLatestKey?: (key: number) => unknown;
};

export type PluginsOptions = {
	citationManager?: CitationManager;
	collaborativeOptions?: CollaborativeOptions;
	isReadOnly?: boolean;
	nodeLabels: NodeLabelMap;
	onChange?: (changeObject: EditorChangeObject) => unknown;
	onError?: (error: Error) => unknown;
	placeholder?: string;
	suggestionManager: SuggestionManager<NodeReference>;
};

export type Doc = { type: 'doc'; attrs: any; content: any[] };

export type OnEditFn = (
	doc: Node,
	tr: Transaction,
	newState: EditorState,
	oldState: EditorState,
) => unknown;

export type CompressedChange = {
	t: number;
	s: Record<string, any>[];
};

export type CompressedKeyable = CompressedChange | CompressedChange[];
