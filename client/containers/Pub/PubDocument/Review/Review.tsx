import React, { useState } from 'react';
import { NonIdealState } from '@blueprintjs/core';

import { DocJson, PubPageData, Community } from 'types';
import { useLocalStorage } from 'client/utils/useLocalStorage';
import { getEmptyDoc } from 'client/components/Editor';
import { usePageContext } from 'utils/hooks';
import { apiFetch } from 'client/utils/apiFetch';

import ReviewEditor from './ReviewEditor';
import ReviewModal from './ReviewModal';

type Props = {
	pubData: PubPageData;
	updatePubData: (...args: any[]) => any;
	communityData: Community;
};

const Review = (props: Props) => {
	const { pubData, updatePubData, communityData } = props;
	const [isLoading, setIsLoading] = useState(false);
	const {
		scopeData: { activePermissions },
		loginData: { fullName },
	} = usePageContext();
	const [reviewTitle, setReviewTitle] = useState('Untitled Review');
	const [reviewerName, setReviewerName] = useState('');
	const [createError, setCreateError] = useState(undefined);
	const url = new URL(window.location.href);
	const query = new URLSearchParams(url.search);

	const { value: review, setValue: setReview } = useLocalStorage<DocJson>({
		initial: () => getEmptyDoc(),
		communityId: communityData.id,
		featureName: 'new-review-editor',
		path: [`pub-${pubData.id}`],
		debounce: 100,
	});

	const isUser = !!(activePermissions.canEdit || fullName);
	const redirectUrl = (reviewToRedirectTo) =>
		isUser ? `/dash/pub/${pubData.slug}/reviews/${reviewToRedirectTo.number}` : `/signup`;

	const handleSubmit = () => {
		setIsLoading(true);
		apiFetch
			.post('/api/reviews', {
				communityId: communityData.id,
				pubId: pubData.id,
				reviewContent: review,
				title: reviewTitle,
				accessHash: query.get('access'),
				reviewerName,
			})
			.then((reviewRes) => {
				updatePubData((currentPubData) => {
					return {
						reviews: [...currentPubData.reviews, reviewRes],
					};
				});
				setIsLoading(false);
				setReview(getEmptyDoc());
				window.location.href = redirectUrl(reviewRes);
			})
			.catch((err) => {
				setIsLoading(false);
				setCreateError(err);
			});
	};

	const updatingReviewDoc = (doc: DocJson) => {
		setReview(doc);
	};

	return (
		<div>
			<ReviewEditor setReviewDoc={updatingReviewDoc} reviewDoc={review} />
			<ReviewModal
				pubData={pubData}
				setReviewTitle={setReviewTitle}
				reviewTitle={reviewTitle}
				setReviewerName={setReviewerName}
				reviewerName={reviewerName}
				onSubmit={handleSubmit}
				isLoading={isLoading}
				isUser={isUser}
			/>
			{createError && (
				<NonIdealState
					title="There was an error submitting your review"
					// @ts-expect-error ts-migrate(2322) FIXME: Type '{ title: string; visual: string; action: Ele... Remove this comment to see the full error message
					visual="error"
					action={
						<a href="/login" className="bp3-button">
							Login or Signup
						</a>
					}
				/>
			)}
		</div>
	);
};

export default Review;
