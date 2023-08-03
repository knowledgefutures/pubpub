import React, { useState } from 'react';
import { Button, Tag, Callout, Intent } from '@blueprintjs/core';
import TimeAgo from 'react-timeago';

import { DashboardFrame, Editor, Thread, ThreadInput } from 'components';
import { usePageContext } from 'utils/hooks';
import { timeAgoBaseProps } from 'utils/dates';
import { apiFetch } from 'client/utils/apiFetch';
import { Review } from 'types';
import { getEmptyDoc } from 'client/components/Editor';

require('./dashboardReview.scss');

type Props = {
	reviewData: Review;
};

const DashboardReview = (props: Props) => {
	const [localReviewData, setLocalReviewData] = useState(props.reviewData);
	const [isClosing, setIsClosing] = useState(false);
	const [isReleasing, setIsReleasing] = useState(false);
	const { loginData, scopeData, communityData } = usePageContext();
	const { author, status, thread, releaseRequested, reviewContent } = localReviewData;
	const { canAdmin } = scopeData.activePermissions;
	const onThreadUpdate = (newThread) => {
		setLocalReviewData({ ...localReviewData, thread: newThread });
	};

	const closeReview = async () => {
		setIsClosing(true);
		const result = await apiFetch('/api/reviews', {
			method: 'PUT',
			body: JSON.stringify({
				status: 'closed',
				reviewId: localReviewData.id,
				pubId: localReviewData.pubId,
				communityId: communityData.id,
			}),
		});
		setIsClosing(false);
		setLocalReviewData({
			...localReviewData,
			...result.updatedValues,
			thread: {
				...localReviewData.thread,
				events: [...localReviewData.thread.events, ...result.newReviewEvents],
			},
		});
	};
	const createRelease = async () => {
		setIsReleasing(true);
		const result = await apiFetch('/api/reviews/release', {
			method: 'POST',
			body: JSON.stringify({
				threadId: localReviewData.threadId,
				reviewId: localReviewData.id,
				pubId: localReviewData.pubId,
				communityId: communityData.id,
			}),
		});
		setLocalReviewData({
			...localReviewData,
			status: 'completed',
			thread: {
				...localReviewData.thread,
				events: [...localReviewData.thread.events, ...result.reviewEvents],
			},
		});
		setIsReleasing(false);
	};

	const isAuthor = loginData && author && loginData.id === author.id;
	const canClose = isAuthor || canAdmin;
	const content = JSON.stringify(reviewContent) !== '{}' ? reviewContent : getEmptyDoc();
	const renderReview = () => {
		return (
			<div className="review">
				<Editor key="reviewDoc" isReadOnly={true} initialContent={content} />
			</div>
		);
	};
	const renderReviewers = () => {
		return localReviewData.reviewers ? (
			localReviewData.reviewers.map((reviewer) => {
				return <span>{reviewer.name}&nbsp;</span>;
			})
		) : isAuthor ? (
			<span>
				<a href={`/user/${author.slug}`}>{author.fullName}</a> created this review{' '}
			</span>
		) : (
			''
		);
	};

	return (
		<DashboardFrame
			className="dashboard-review-container"
			title={
				<span>
					Reviews: {localReviewData.title}
					<span className="number">(R{localReviewData.number})</span>
				</span>
			}
			details={
				<React.Fragment>
					<Tag className={status} minimal={true} large={true}>
						{status}
					</Tag>
					<span>
						{renderReviewers()}
						<TimeAgo {...timeAgoBaseProps} date={localReviewData.createdAt} />
					</span>
				</React.Fragment>
			}
			controls={
				canClose &&
				localReviewData.status === 'open' && (
					<Button
						key="close"
						text="Close Review"
						loading={isClosing}
						onClick={closeReview}
					/>
				)
			}
		>
			{renderReview()}
			<Thread threadData={thread} />
			<ThreadInput
				parentId={localReviewData.id}
				pubId={localReviewData.pubId}
				threadData={thread}
				// @ts-expect-error ts-migrate(2322) FIXME: Type '(newThread: any) => void' is not assignable ... Remove this comment to see the full error message
				onThreadUpdate={onThreadUpdate}
			/>
			{canAdmin && status === 'open' && releaseRequested && (
				<Callout
					intent={Intent.WARNING}
					icon="document-share"
					title="Publication Requested"
				>
					{author.fullName} has requested that a Release be published from the Draft. If
					this review is satisfactory, you can create the Release here directly.{' '}
					<div style={{ marginTop: '1em' }}>
						<Button
							text="Create Release from Draft"
							intent={Intent.PRIMARY}
							onClick={createRelease}
							loading={isReleasing}
						/>
					</div>
				</Callout>
			)}
			{/* <ThreadOptions /> */}
		</DashboardFrame>
	);
};
export default DashboardReview;
