/* eslint-disable react/no-danger */
import React from 'react';

require('./pubNoteContent.scss');

type Props = {
	structured?: string;
	unstructured?: string;
};

const defaultProps = {
	structured: '',
	unstructured: '',
};

const PubNoteContent = React.forwardRef<any, Props>((props, ref) => {
	const { structured, unstructured } = props;
	return (
		<span ref={ref} className="pub-note-content-component">
			<span dangerouslySetInnerHTML={{ __html: (structured || '').split('\n').join('') }} />
			<span dangerouslySetInnerHTML={{ __html: (unstructured || '').split('\n').join('') }} />
		</span>
	);
});
PubNoteContent.defaultProps = defaultProps;
export default PubNoteContent;
