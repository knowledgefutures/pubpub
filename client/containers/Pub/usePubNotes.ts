import { useState, useEffect, useMemo } from 'react';

import { citationFingerprintStripTags, getNotes } from 'components/Editor/utils';
import { renderAndSortNotes } from '../../../utils/notes';

import { usePubContext } from './pubHooks';

export const usePubNotes = () => {
	const {
		noteManager,
		collabData: { editorChangeObject },
	} = usePubContext();
	const [renderedStructuredValues, setRenderedStructuredValues] = useState(noteManager.notes);
	const { citationInlineStyleKind: citationInlineStyle } = noteManager;
	const view = editorChangeObject!.view;

	const { citations = [], footnotes = [] } = view
		? getNotes(view.state.doc, citationFingerprintStripTags)
		: {};

	const renderedNotes = useMemo(
		() =>
			renderAndSortNotes({
				citations,
				footnotes,
				citationInlineStyle,
				renderedStructuredValues,
			}),
		[citations, footnotes, citationInlineStyle, renderedStructuredValues],
	);

	useEffect(() => noteManager.subscribe(setRenderedStructuredValues), [noteManager]);

	return renderedNotes;
};
