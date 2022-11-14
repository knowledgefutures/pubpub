import React, { useCallback } from 'react';

import { MinimalEditor } from 'components';
import { DocJson } from 'types';

type Props = {
	setReviewDoc: (doc: DocJson) => void;
	reviewDoc: DocJson;
};

const ReviewEditor = (props: Props) => {
	const { setReviewDoc, reviewDoc } = props;

	const handleEdit = useCallback((doc) => setReviewDoc(doc.toJSON() as DocJson), [setReviewDoc]);

	return (
		<div className="review-editor-component">
			<MinimalEditor
				getButtons={(buttons) => buttons.reviewButtonSet}
				onEdit={handleEdit}
				useFormattingBar
				focusOnLoad={true}
				initialContent={reviewDoc}
				placeholder="Compose your review here..."
			/>
		</div>
	);
};

export default ReviewEditor;
