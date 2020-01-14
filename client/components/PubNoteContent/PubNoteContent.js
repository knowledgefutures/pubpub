/* eslint-disable react/no-danger */
import React from 'react';
import PropTypes from 'prop-types';

require('./pubNoteContent.scss');

const propTypes = {
	structured: PropTypes.string,
	unstructured: PropTypes.string,
};

const defaultProps = {
	structured: '',
	unstructured: '',
};

const PubNoteContent = React.forwardRef((props, ref) => {
	const { structured, unstructured } = props;
	return (
		<span ref={ref} className="pub-note-content-component">
			<span dangerouslySetInnerHTML={{ __html: (structured || '').split('\n').join('') }} />
			<span dangerouslySetInnerHTML={{ __html: (unstructured || '').split('\n').join('') }} />
		</span>
	);
});

PubNoteContent.propTypes = propTypes;
PubNoteContent.defaultProps = defaultProps;
export default PubNoteContent;
