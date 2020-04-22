import { Node } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { buildSchema, getEmptyDoc } from '../../utils';

const schema = buildSchema();

export const createEditorViewWithInitialDoc = (doc = getEmptyDoc(), plugins = []) => {
	const editorState = EditorState.create({
		schema: schema,
		doc: Node.fromJSON(schema, doc),
		plugins: plugins,
	});
	const editorView = new EditorView(null, { state: editorState });
	return editorView;
};
