import { useState, useEffect, useMemo } from 'react';

import { getNotes } from 'components/Editor/utils';

import { usePubContext } from './pubHooks';

const getRenderedValue = (note) => {
	const hasRenderedStructuredValue = note.renderedStructuredValue?.json?.length;
	return hasRenderedStructuredValue ? note.renderedStructuredValue.html : note.unstructuredValue;
};

export const usePubNotes = () => {
	const {
		noteManager,
		collabData: { editorChangeObject },
	} = usePubContext();

	const [notes, setNotes] = useState(noteManager.notes);

	const view = editorChangeObject!.view;
	const { citations = [], footnotes = [] } = view ? getNotes(view.state.doc) : {};

	const isNumberList = noteManager.citationInlineStyleKind === 'count';
	const renderedFootnotes = footnotes.map((footnote, index) => ({
		...footnote,
		renderedStructuredValue: notes[footnote.structuredValue],
		number: index + 1,
	}));
	const renderedCitations = useMemo(
		() =>
			citations
				.map((citation) => ({
					...citation,
					renderedStructuredValue: notes[citation.structuredValue],
				}))
				.map((citation, index) => ({
					...citation,
					...(isNumberList && { number: index + 1 }),
					sortString: getRenderedValue(citation)
						.replace(/(<([^>]+)>)/gi, '')
						.toLowerCase()
						.trim(),
				}))
				.sort((a, b) => {
					if (isNumberList) return 0;
					return a.sortString > b.sortString ? 1 : -1;
				}),
		[citations, notes, isNumberList],
	);

	useEffect(() => noteManager.subscribe(setNotes), [noteManager]);

	return { footnotes: renderedFootnotes, citations: renderedCitations };
};
