import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { ButtonGroup, Button, Intent, Tag, Tabs, Tab } from '@blueprintjs/core';
import { pubDataProps } from 'types/pub';
import { GridWrapper, Icon, InputField } from 'components';
import { PageContext } from 'components/PageWrapper/PageWrapper';
import { apiFetch } from 'utils';
import ReviewEvent from './ReviewEvent';

require('./pubReview.scss');

const propTypes = {
	pubData: pubDataProps.isRequired,
	updateLocalData: PropTypes.func.isRequired,
};

const PubReview = (props) => {
	const { pubData, updateLocalData } = props;
	const { communityData, locationData, loginData } = useContext(PageContext);
	const [isLoading, setIsLoading] = useState(undefined);
	const [isLoadingCreateComment, setIsLoadingCreateComment] = useState(false);
	const [currentTab, setCurrentTab] = useState('details');
	const [noteText, setNoteText] = useState('');

	const activeReview = pubData.reviews.find((review) => {
		return review.shortId === Number(locationData.params.reviewShortId);
	});
	const sourceBranch = pubData.branches.find((branch) => {
		return branch.id === activeReview.sourceBranchId;
	});
	const destinationBranch = pubData.branches.find((branch) => {
		return branch.id === activeReview.destinationBranchId;
	});

	const mergeBranch = (review) => {
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
			.then((mergeResult) => {
				updateLocalData('pub', {
					...pubData,
					reviews: pubData.reviews.map((reviewItem) => {
						if (reviewItem.id === activeReview.id) {
							return {
								...reviewItem,
								mergeId: mergeResult.newMerge.id,
								reviewEvents: [
									...reviewItem.reviewEvents,
									...mergeResult.newReviewEvents,
								],
							};
						}
						return reviewItem;
					}),
				});
				setIsLoading(undefined);
			})
			.catch((err) => {
				console.error(err);
			});
	};

	const updateReview = (updatedData, reviewId) => {
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
			.then((updateResult) => {
				updateLocalData('pub', {
					...pubData,
					reviews: pubData.reviews.map((review) => {
						if (review.id === reviewId) {
							return {
								...review,
								...updateResult.updatedValues,
								reviewEvents: [
									...review.reviewEvents,
									...updateResult.newReviewEvents,
								],
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

	const createComment = () => {
		setIsLoadingCreateComment(true);
		return apiFetch('/api/reviewEvents', {
			method: 'POST',
			body: JSON.stringify({
				type: 'comment',
				data: { text: noteText },
				reviewId: activeReview.id,
				pubId: pubData.id,
				communityId: communityData.id,
			}),
		})
			.then((newReviewEvent) => {
				updateLocalData('pub', {
					...pubData,
					reviews: pubData.reviews.map((review) => {
						if (review.id === activeReview.id) {
							return {
								...review,
								reviewEvents: [...review.reviewEvents, newReviewEvent],
							};
						}
						return review;
					}),
				});
				setNoteText('');
				setIsLoadingCreateComment(undefined);
			})
			.catch((err) => {
				console.error(err);
			});
	};

	let statusIntent;
	if (activeReview.isClosed && !activeReview.isCompleted) {
		statusIntent = Intent.DANGER;
	}
	if (activeReview.isCompleted) {
		statusIntent = Intent.SUCCESS;
	}
	if (activeReview.mergeId) {
		statusIntent = Intent.SUCCESS;
	}

	return (
		<GridWrapper containerClassName="pub pub-reviews-component">
			<div className="review-header">
				<h2>Review {activeReview.shortId}</h2>
				<Tag minimal={true} large={true}>
					#{sourceBranch.title}{' '}
					<Icon icon="arrow-right" iconSize={14} className="merge-arrow" /> #
					{destinationBranch.title}
				</Tag>
			</div>
			<Tag className="status-tag" minimal={true} large={true} intent={statusIntent}>
				{!activeReview.isClosed && 'Open'}
				{activeReview.isClosed && !activeReview.isCompleted && 'Closed'}
				{activeReview.isCompleted && !activeReview.mergeId && 'Completed'}
				{activeReview.mergeId && 'Merged'}
			</Tag>

			<Tabs
				onChange={(newTab) => {
					setCurrentTab(newTab);
				}}
				selectedTabId={currentTab}
			>
				<Tab
					id="details"
					title="Details"
					panel={
						<div>
							{/* Show Events */}
							{activeReview.reviewEvents.map((event) => {
								return (
									<ReviewEvent
										key={event.id}
										pubData={pubData}
										eventData={event}
										updateLocalData={updateLocalData}
									/>
								);
							})}
							{/* Show input box */}
							<InputField
								label="Note"
								isTextarea={true}
								placeholder="Add a note for the review team."
								value={noteText}
								onChange={(evt) => {
									setNoteText(evt.target.value);
								}}
							/>
							<Button
								intent={Intent.PRIMARY}
								text="Add comment"
								loading={isLoadingCreateComment}
								onClick={createComment}
							/>

							{/* Show actions */}
							<ButtonGroup>
								{!activeReview.isClosed && (
									<React.Fragment>
										<Button
											key="close"
											text="Close"
											loading={isLoading === `close-${activeReview.id}`}
											disabled={isLoading === `complete-${activeReview.id}`}
											onClick={() => {
												updateReview(
													{ isClosed: true },
													activeReview.id,
													sourceBranch,
													destinationBranch,
												);
											}}
										/>
										<Button
											key="complete"
											text="Complete"
											loading={isLoading === `complete-${activeReview.id}`}
											disabled={isLoading === `close-${activeReview.id}`}
											onClick={() => {
												updateReview(
													{ isClosed: true, isCompleted: true },
													activeReview.id,
													sourceBranch,
													destinationBranch,
												);
											}}
										/>
									</React.Fragment>
								)}

								{activeReview.isCompleted &&
									!activeReview.mergeId &&
									destinationBranch.id &&
									destinationBranch.canManage && (
										<Button
											text="Merge"
											loading={isLoading === `merge-${activeReview.id}`}
											onClick={() => {
												mergeBranch(
													activeReview,
													sourceBranch,
													destinationBranch,
												);
											}}
										/>
									)}
							</ButtonGroup>
						</div>
					}
				/>

				{/* <Tab id="doc" title="Document" panel={<div>Doc here</div>} /> */}
			</Tabs>
		</GridWrapper>
	);
};

PubReview.propTypes = propTypes;
export default PubReview;
