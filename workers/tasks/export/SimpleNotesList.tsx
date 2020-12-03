/**
 * This component is used in generated exports to render footnote and citation lists.
 */
import React from 'react';

import { PubNoteContent } from 'components';

type Props = {
	notes: {
		structuredHtml?: string;
		unstructuredValue?: string;
	}[];
	getLinkage: (...args: any[]) => any;
	title: string;
};

const SimpleNotesList = (props: Props) => {
	const { notes, title, getLinkage } = props;
	if (notes.length === 0) {
		return null;
	}
	return (
		<React.Fragment>
			<h1>{title}</h1>
			<ol>
				{notes.map((note, index) => {
					const { bottomElementId, inlineElementId } = getLinkage(note, index);
					return (
						<li key={bottomElementId} id={bottomElementId}>
							<PubNoteContent
								structured={note.structuredHtml}
								unstructured={note.unstructuredValue}
							/>{' '}
							<a href={`#${inlineElementId}`} className="return-link">
								↩
							</a>
						</li>
					);
				})}
			</ol>
		</React.Fragment>
	);
};
export default SimpleNotesList;
