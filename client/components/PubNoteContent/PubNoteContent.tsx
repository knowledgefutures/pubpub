/* eslint-disable react/no-danger */
import React from 'react';

require('./pubNoteContent.scss');

type Props = {
	structured?: string;
	unstructured?: string;
};

const PubNoteContent = React.forwardRef((props: Props, ref: React.Ref<any>) => {
	const { structured = '', unstructured = '' } = props;
	return (
		<span ref={ref} className="pub-note-content-component">
			<span dangerouslySetInnerHTML={{ __html: (structured || '').split('\n').join('') }} />
			<span dangerouslySetInnerHTML={{ __html: (unstructured || '').split('\n').join('') }} />
		</span>
	);
});

export default PubNoteContent;
