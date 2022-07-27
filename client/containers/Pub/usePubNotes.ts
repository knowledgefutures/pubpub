import { useState, useEffect, useMemo } from 'react';

import { getNotesByKindFromDoc } from 'components/Editor/utils';
import { renderNotesForListing } from '../../../utils/notes';

import { usePubContext } from './pubHooks';

export const usePubNotes = () => {
	const {
		noteManager,
		collabData: { editorChangeObject },
	} = usePubContext();
	const [renderedStructuredValues, setRenderedStructuredValues] = useState(noteManager.notes);
	const { citationInlineStyleKind: citationInlineStyle } = noteManager;
	const view = editorChangeObject!.view;

	const { citations = [], footnotes = [] } = view ? getNotesByKindFromDoc(view.state.doc) : {};

	const renderedNotes = useMemo(
		() =>
			renderNotesForListing({
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
