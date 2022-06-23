/**
 * This component is used in generated exports to render footnote and citation lists.
 */
import React from 'react';

import { PubNoteContent } from 'components';
import { RenderedNote } from 'utils/notes';

type Props = {
	notes: RenderedNote[];
	getLinkage: (...args: any[]) => any;
	title: string;
};

const SimpleNotesList = (props: Props) => {
	const { notes, title, getLinkage } = props;
	if (notes.length === 0) {
		return null;
	}
	const isNumberedList = notes.some((note) => typeof note.number === 'number');
	const ListWrapper = isNumberedList ? 'ol' : 'ul';
	return (
		<React.Fragment>
			<h1>{title}</h1>
			<ListWrapper>
				{notes.map((note, index) => {
					const { bottomElementId, inlineElementId } = getLinkage(note, index);
					return (
						<li key={bottomElementId} id={bottomElementId}>
							<PubNoteContent
								structured={note.renderedStructuredValue?.html}
								unstructured={note.unstructuredValue}
							/>{' '}
							<a href={`#${inlineElementId}`} className="return-link">
								↩
							</a>
						</li>
					);
				})}
			</ListWrapper>
		</React.Fragment>
	);
};
export default SimpleNotesList;
