import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import TimeAgo from 'react-timeago';
import { Tag, Button, Intent, ButtonGroup } from '@blueprintjs/core';
import { pubDataProps } from 'types/pub';
import { GridWrapper, Icon } from 'components';
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
	const [isLoading, setIsLoading] = useState(undefined);

	const mergeBranch = (review, sourceBranch, destinationBranch) => {
		setIsLoading(`merge-${review.id}`);
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
		setIsLoading(updatedData.isCompleted ? `complete-${reviewId}` : `close-${reviewId}`);
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
				setIsLoading(undefined);
			})
			.catch((err) => {
				console.error(err);
			});
	};

	return (
		<GridWrapper containerClassName="pub pub-reviews-component">
			<h2>Reviews</h2>
			{pubData.reviews
				.sort((foo, bar) => {
					return bar.shortId - foo.shortId;
				})
				.map((review) => {
					console.log(isLoading, isLoading === `close-${review.id}`);
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
							<div className="short-id">{review.shortId}</div>

							<Tag minimal={true} className="branch-tag">
								#{sourceBranch.title}{' '}
								{destinationBranch.id && (
									<React.Fragment>
										<Icon
											icon="arrow-right"
											iconSize={12}
											className="merge-arrow"
										/>{' '}
										#
									</React.Fragment>
								)}
								{destinationBranch.title}
							</Tag>

							<div className="date">
								Opened
								<TimeAgo
									minPeriod={60}
									formatter={(value, unit, suffix) => {
										if (unit === 'second') {
											return 'just now';
										}
										let newUnit = unit;
										if (value > 1) {
											newUnit += 's';
										}
										return ` ${value} ${newUnit} ${suffix}`;
									}}
									date={review.createdAt}
								/>
							</div>

							<ButtonGroup>
								{!review.isClosed && (
									<React.Fragment>
										<Button
											key="close"
											text="Close"
											loading={isLoading === `close-${review.id}`}
											disabled={isLoading === `complete-${review.id}`}
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
											key="complete"
											text="Complete"
											loading={isLoading === `complete-${review.id}`}
											disabled={isLoading === `close-${review.id}`}
											onClick={() => {
												updateReview(
													{ isClosed: true, isCompleted: true },
													review.id,
													sourceBranch,
													destinationBranch,
												);
											}}
										/>
									</React.Fragment>
								)}

								{review.isCompleted &&
									!review.mergeId &&
									destinationBranch.id &&
									destinationBranch.canManage && (
										<Button
											text="Merge"
											loading={isLoading === `merge-${review.id}`}
											onClick={() => {
												mergeBranch(
													review,
													sourceBranch,
													destinationBranch,
												);
											}}
										/>
									)}
							</ButtonGroup>
							<div>
								<Tag
									className="status-tag"
									minimal={true}
									large={true}
									intent={statusIntent}
								>
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
