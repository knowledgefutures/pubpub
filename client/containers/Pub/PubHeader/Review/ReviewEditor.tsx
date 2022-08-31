import React from 'react';

import { MinimalEditor } from 'components';
import { DocJson } from 'types';

type Props = {
	setReviewDoc: (doc: DocJson) => void;
	reviewDoc: DocJson;
};

const ReviewEditor = (props: Props) => {
	const { setReviewDoc, reviewDoc } = props;

	return (
		<div className="review-editor-component">
			<MinimalEditor
				getButtons={(buttons) => buttons.reviewButtonSet}
				onEdit={(doc) => setReviewDoc(doc.toJSON() as DocJson)}
				useFormattingBar
				focusOnLoad={true}
				initialContent={reviewDoc}
				placeholder="Compose your review here..."
			/>
		</div>
	);
};

export default ReviewEditor;
