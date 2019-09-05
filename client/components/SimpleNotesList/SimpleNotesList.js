/**
 * This component is used in generated exports to render footnote and citation lists.
 */
import React from 'react';
import PropTypes from 'prop-types';

import { PubNoteContent } from 'components';
import { notePropType } from 'containers/Pub/PubDocument/PubBottom/Notes';

const propTypes = {
	notes: PropTypes.arrayOf(notePropType).isRequired,
	title: PropTypes.string.isRequired,
};

const SimpleNotesList = (props) => {
	const { notes, title } = props;
	if (notes.length === 0) {
		return null;
	}
	return (
		<React.Fragment>
			<h1>{title}</h1>
			<ol>
				{notes.map((note, index) => (
					// eslint-disable-next-line react/no-array-index-key
					<li key={index}>
						<PubNoteContent
							structured={note.html}
							unstructured={note.unstructuredValue}
						/>
					</li>
				))}
			</ol>
		</React.Fragment>
	);
};

SimpleNotesList.propTypes = propTypes;
export default SimpleNotesList;
