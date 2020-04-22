/* global describe, it, expect */
import { configureTest } from './utils/configure';
import { createEditorViewWithInitialDoc } from './utils/editor';
import collaborative, { collabDocPluginKey } from '../plugins/collaborative';
import { getEmptyDoc } from '../utils';

const { doc, branchRef } = configureTest('simple');

describe('collaborative.js loading', () => {
	it('loads a document correctly', async () => {
		const initialDoc = getEmptyDoc();
		const plugins = collaborative(doc.schema, {
			initialContent: initialDoc,
			collaborativeOptions: {
				delayLoadingDocument: true,
				clientData: { id: 'any' },
				firebaseRef: branchRef,
				initialDocKey: -1,
			},
		});
		const editorView = createEditorViewWithInitialDoc(initialDoc, plugins);
		await collabDocPluginKey.get(editorView.state).loadDocument();
		const loadedDoc = editorView.state.doc.toJSON();
		expect(loadedDoc).toEqual(doc);
	});
});
