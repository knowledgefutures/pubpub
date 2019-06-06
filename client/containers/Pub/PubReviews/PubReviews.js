import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import dateFormat from 'dateformat';
import { Tag, Button, Intent } from '@blueprintjs/core';
import { pubDataProps } from 'types/pub';
import { GridWrapper } from 'components';
import { PageContext } from 'components/PageWrapper/PageWrapper';
import { apiFetch } from 'utils';

require('./pubReviews.scss');

const propTypes = {
	pubData: pubDataProps.isRequired,
	updateLocalData: PropTypes.func.isRequired,
};

const PubReviews = (props) => {
	const { pubData, updateLocalData } = props;
	const { communityData } = useContext(PageContext);
	const [isLoading, setIsLoading] = useState(false);

	const mergeBranch = (review, sourceBranch, destinationBranch) => {
		setIsLoading(true);
		return apiFetch('/api/merges', {
			method: 'POST',
			body: JSON.stringify({
				note: `Merge from Review ${review.shortId}`,
				reviewId: review.id,
				sourceBranchId: sourceBranch.id,
				destinationBranchId: destinationBranch.id,
				pubId: pubData.id,
				communityId: communityData.id,
			}),
		})
			.then(() => {
				window.location.href = `/pub/${pubData.slug}/branch/${destinationBranch.shortId}`;
			})
			.catch((err) => {
				console.error(err);
			});
	};

	const updateReview = (updatedData, reviewId, sourceBranch, destinationBranch) => {
		setIsLoading(true);
		return apiFetch('/api/reviews', {
			method: 'PUT',
			body: JSON.stringify({
				...updatedData,
				reviewId: reviewId,
				sourceBranchId: sourceBranch.id,
				destinationBranchId: destinationBranch && destinationBranch.id,
				pubId: pubData.id,
				communityId: communityData.id,
			}),
		})
			.then(() => {
				updateLocalData('pub', {
					...pubData,
					reviews: pubData.reviews.map((review) => {
						if (review.id === reviewId) {
							return {
								...review,
								...updatedData,
							};
						}
						return review;
					}),
				});
				setIsLoading(false);
			})
			.catch((err) => {
				console.error(err);
			});
	};

	return (
		<GridWrapper containerClassName="pub pub-reviews-component">
			<h1>Reviews</h1>
			{pubData.reviews.map((review) => {
				const sourceBranch = pubData.branches.find((branch) => {
					return branch.id === review.sourceBranchId;
				});
				const destinationBranch = pubData.branches.find((branch) => {
					return branch.id === review.destinationBranchId;
				});

				let statusIntent;
				if (review.isClosed && !review.isCompleted) {
					statusIntent = Intent.DANGER;
				}
				if (review.isCompleted) {
					statusIntent = Intent.SUCCESS;
				}
				if (review.mergeId) {
					statusIntent = Intent.SUCCESS;
				}
				return (
					<div className="review-row" key={review.id}>
						<div>
							<b>{review.shortId}</b>
						</div>
						<div>
							{sourceBranch.title} -> {destinationBranch && destinationBranch.title}
						</div>
						<div className="expand">{dateFormat(review.createdAt, 'mmm dd, yyyy')}</div>

						{!review.isClosed && (
							<div>
								<Button
									text="Close"
									loading={isLoading}
									onClick={() => {
										updateReview(
											{ isClosed: true },
											review.id,
											sourceBranch,
											destinationBranch,
										);
									}}
								/>
								<Button
									text="Complete"
									loading={isLoading}
									onClick={() => {
										updateReview(
											{ isClosed: true, isCompleted: true },
											review.id,
											sourceBranch,
											destinationBranch,
										);
									}}
								/>
							</div>
						)}

						{review.isCompleted &&
							!review.mergeId &&
							destinationBranch.id &&
							destinationBranch.canManage && (
								<div>
									<Button
										text="Merge"
										loading={isLoading}
										onClick={() => {
											mergeBranch(review, sourceBranch, destinationBranch);
										}}
									/>
								</div>
							)}
						<div>
							<Tag minimal={true} large={true} intent={statusIntent}>
								{!review.isClosed && 'Open'}
								{review.isClosed && !review.isCompleted && 'Closed'}
								{review.isCompleted && !review.mergeId && 'Completed'}
								{review.mergeId && 'Merged'}
							</Tag>
						</div>
					</div>
				);
			})}
		</GridWrapper>
	);
};

PubReviews.propTypes = propTypes;
export default PubReviews;
