/* eslint-disable react/no-danger */
import React, { useMemo } from 'react';
import linkifyHtml from 'linkifyjs/html';

require('./pubNoteContent.scss');

type Props = {
	structured?: string;
	unstructured?: string;
};

const PubNoteContent = React.forwardRef((props: Props, ref: React.Ref<any>) => {
	const { structured = '', unstructured = '' } = props;
	const linkedStructured = useMemo(() => linkifyHtml(structured), [structured]);
	const linkedUnstructured = useMemo(() => linkifyHtml(unstructured), [unstructured]);
	return (
		<span ref={ref} className="pub-note-content-component">
			<span
				dangerouslySetInnerHTML={{ __html: (linkedStructured || '').split('\n').join('') }}
			/>
			<span
				dangerouslySetInnerHTML={{
					__html: (linkedUnstructured || '').split('\n').join(''),
				}}
			/>
		</span>
	);
});

export default PubNoteContent;
