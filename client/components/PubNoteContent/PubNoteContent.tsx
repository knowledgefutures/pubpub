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
	// @ts-expect-error ts-migrate(2339) FIXME: Property 'structured' does not exist on type '{ ch... Remove this comment to see the full error message
	const { structured, unstructured } = props;
	return (
		// @ts-expect-error ts-migrate(2322) FIXME: Type 'unknown' is not assignable to type 'HTMLSpan... Remove this comment to see the full error message
		<span ref={ref} className="pub-note-content-component">
			<span dangerouslySetInnerHTML={{ __html: (structured || '').split('\n').join('') }} />
			<span dangerouslySetInnerHTML={{ __html: (unstructured || '').split('\n').join('') }} />
		</span>
	);
});

// @ts-expect-error ts-migrate(2559) FIXME: Type '{ structured: Requireable<string>; unstructu... Remove this comment to see the full error message
PubNoteContent.propTypes = propTypes;
// @ts-expect-error ts-migrate(2559) FIXME: Type '{ structured: string; unstructured: string; ... Remove this comment to see the full error message
PubNoteContent.defaultProps = defaultProps;
export default PubNoteContent;
