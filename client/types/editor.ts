import { EditorView } from 'prosemirror-view';

export type EditorChangeObject = {
	insertFunctions: Record<string, (...args: any[]) => any>;
	selectedNode?: {
		attrs?: {
			targetId?: string;
		};
	};
	updateNode: (...args: unknown[]) => unknown;
	view: EditorView;
};
