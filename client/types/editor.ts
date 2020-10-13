import { EditorView } from 'prosemirror-view';

export type EditorChangeObject = {
	selectedNode?: {
		attrs?: {
			targetId?: string;
		};
	};
	updateNode: (...args: unknown[]) => unknown;
	view: EditorView;
};
