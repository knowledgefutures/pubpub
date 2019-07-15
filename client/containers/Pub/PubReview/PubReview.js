import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Intent, Tag, Tabs, Tab, Callout } from '@blueprintjs/core';
import { pubDataProps } from 'types/pub';
import { GridWrapper, Icon, InputField, MinimalEditor } from 'components';
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
	const { communityData, locationData } = useContext(PageContext);
	const [isLoading, setIsLoading] = useState(undefined);
	const [isLoadingCreateComment, setIsLoadingCreateComment] = useState(false);
	const [currentTab, setCurrentTab] = useState('details');
	const [noteData, setNoteData] = useState({});
	const [noteKey, setNoteKey] = useState(Math.random());

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
				data: { content: noteData.content, text: noteData.text },
				reviewId: activeReview.id,
				pubId: pubData.id,
				communityId: communityData.id,
			}),
		})
			.then((newReviewEvent) => {
				updateLocalData('pub', {
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
				setNoteKey(Math.random());
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

	const canMerge =
		activeReview.isCompleted &&
		!activeReview.mergeId &&
		destinationBranch.id &&
		destinationBranch.canManage;
	return (
		<div className="pub-review-component">
			<GridWrapper containerClassName="pub">
				<div className="review-header">
					<h2>Review {activeReview.shortId}</h2>
					<Tag minimal={true} large={true}>
						#{sourceBranch.title}{' '}
						<Icon icon="arrow-right" iconSize={14} className="merge-arrow" /> #
						{destinationBranch.title}
					</Tag>
					{/* Show actions */}
					{(!activeReview.isClosed || canMerge) && (
						<div className="actions-block">
							{!activeReview.isClosed && (
								<React.Fragment>
									{destinationBranch.canManage && (
										<Button
											key="complete"
											text="Complete Review"
											intent={Intent.SUCCESS}
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
									)}
									<Button
										key="close"
										text="Close Review"
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
								</React.Fragment>
							)}

							{canMerge && (
								<Button
									text={`Merge to #${destinationBranch.title}`}
									loading={isLoading === `merge-${activeReview.id}`}
									onClick={() => {
										mergeBranch(activeReview, sourceBranch, destinationBranch);
									}}
								/>
							)}
						</div>
					)}
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
								<Callout
									title="New Feature"
									icon="cube-add"
									intent={Intent.WARNING}
									style={{ marginBottom: '2em' }}
								>
									<p>
										With the introduction of{' '}
										<a href="https://discourse.knowledgefutures.org/t/branches/157">
											branches
										</a>{' '}
										we're beginning to roll out new review capabilities. We're
										starting with limited functionality and will be pushing
										updates soon. Share your input and learn{' '}
										<a href="https://discourse.knowledgefutures.org/t/feature-discussion-reviews/166">
											how we're thinking about reviews here
										</a>
										.
									</p>
								</Callout>
								{/* Show Events */}
								{activeReview.reviewEvents
									.sort((foo, bar) => {
										if (foo.createdAt < bar.createdAt) {
											return -1;
										}
										if (foo.createdAt > bar.createdAt) {
											return 1;
										}
										return foo.type === 'status' ? -1 : 1;
									})
									.map((event) => {
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
								<InputField label="Note">
									<MinimalEditor
										key={noteKey}
										onChange={(data) => {
											setNoteData(data);
										}}
										placeholder="Add a note for the review team."
									/>
								</InputField>
								<Button
									intent={Intent.PRIMARY}
									text="Add comment"
									loading={isLoadingCreateComment}
									onClick={createComment}
									disabled={!noteData.text}
								/>
							</div>
						}
					/>

					{/* <Tab id="doc" title="Document" panel={<div>Doc here</div>} /> */}
				</Tabs>
			</GridWrapper>
		</div>
	);
};

PubReview.propTypes = propTypes;
export default PubReview;
