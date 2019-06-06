import React, { useContext, useState } from 'react';
import { AnchorButton, Button, Intent, NonIdealState } from '@blueprintjs/core';
import { pubDataProps } from 'types/pub';
import { GridWrapper } from 'components';
import { PageContext } from 'components/PageWrapper/PageWrapper';
import { apiFetch } from 'utils';

const propTypes = {
	pubData: pubDataProps.isRequired,
};

const PubReviewCreate = (props) => {
	const { pubData } = props;
	const { locationData, communityData } = useContext(PageContext);
	const [isLoading, setIsLoading] = useState(false);
	const sourceBranch = pubData.branches.find((branch) => {
		return branch.shortId === Number(locationData.params.fromBranchShortId);
	});
	const destinationBranch = pubData.branches.find((branch) => {
		return branch.shortId === Number(locationData.params.toBranchShortId);
	});

	const createReview = () => {
		setIsLoading(true);
		return apiFetch('/api/reviews', {
			method: 'POST',
			body: JSON.stringify({
				sourceBranchId: sourceBranch.id,
				destinationBranchId: destinationBranch.id,
				pubId: pubData.id,
				communityId: communityData.id,
			}),
		})
			.then((newReview) => {
				window.location.href = `/pub/${pubData.slug}/reviews/${newReview.shortId}`;
			})
			.catch((err) => {
				console.error(err);
			});
	};

	const existingReview = pubData.reviews.reduce((prev, curr) => {
		if (
			curr.destinationBranchId === destinationBranch.id &&
			curr.sourceBranchId === sourceBranch.id &&
			!curr.isClosed
		) {
			return curr;
		}
		return prev;
	}, false);
	return (
		<GridWrapper containerClassName="pub pub-review-create-component">
			<h1>New Review</h1>
			<p>
				{sourceBranch.title} -> {destinationBranch.title}
			</p>

			{existingReview && (
				<NonIdealState
					icon="issue"
					title="Review already open"
					action={
						<AnchorButton
							intent={Intent.PRIMARY}
							text="Go to existing review"
							href={`/pub/${pubData.slug}/reviews/${existingReview.shortId}`}
						/>
					}
				/>
			)}
			{!existingReview && (
				<Button
					intent={Intent.PRIMARY}
					text="Create Review"
					loading={isLoading}
					onClick={createReview}
				/>
			)}
		</GridWrapper>
	);
};

PubReviewCreate.propTypes = propTypes;
export default PubReviewCreate;
