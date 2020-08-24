/**
 * This component is used in generated exports to render footnote and citation lists.
 */
import React from 'react';
import PropTypes from 'prop-types';

import { PubNoteContent } from 'components';

const propTypes = {
	notes: PropTypes.arrayOf(
		PropTypes.shape({
			structuredHtml: PropTypes.string,
			unstructuredValue: PropTypes.string,
		}),
	).isRequired,
	getLinkage: PropTypes.func.isRequired,
	title: PropTypes.string.isRequired,
};

const SimpleNotesList = (props) => {
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

SimpleNotesList.propTypes = propTypes;
export default SimpleNotesList;
