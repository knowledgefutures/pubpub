import React, { useMemo, useState } from 'react';
import { Button } from '@blueprintjs/core';
import Color from 'color';

import { DocJson, Community } from 'types';
import { isEmptyDoc } from 'client/components/Editor';

import ReviewEditor from './ReviewEditor';

require('./review.scss');

type Props = {
	communityData: Community;
	onSubmit: any;
	isLoading: boolean;
	review: DocJson;
	updateReview: (doc: DocJson) => void;
};

const Review = (props: Props) => {
	const { communityData, onSubmit, isLoading, review, updateReview } = props;

	const [hover, setHover] = useState(false);

	const lighterAccentColor = useMemo(
		() => Color(communityData.accentColorDark).alpha(0.4),
		[communityData.accentColorDark],
	);
	const bgColor = isEmptyDoc(review as DocJson)
		? 'lightgray'
		: !hover
		? lighterAccentColor
		: communityData.accentColorDark;

	return (
		<div className="review-component">
			<div className="review-border" style={{ borderColor: bgColor }}>
				<ReviewEditor setReviewDoc={updateReview} reviewDoc={review} />
			</div>
			<div className="review-button">
				<Button
					icon="document-share"
					onClick={onSubmit}
					minimal={true}
					loading={isLoading}
					className="review-submission-button"
					style={{ background: bgColor }}
					intent="primary"
					disabled={isEmptyDoc(review as DocJson)}
					onMouseEnter={() => setHover(true)}
					onMouseLeave={() => setHover(false)}
				>
					Submit Review
				</Button>
			</div>
		</div>
	);
};

export default Review;
