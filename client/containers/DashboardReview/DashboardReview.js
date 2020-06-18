import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Tag, Callout, Intent } from '@blueprintjs/core';
import TimeAgo from 'react-timeago';

import { DashboardFrame, Thread, ThreadInput } from 'components';
import { usePageContext } from 'utils/hooks';
import { timeAgoBaseProps } from 'utils/dates';
import { apiFetch } from 'client/utils/apiFetch';

require('./dashboardReview.scss');

const propTypes = {
	reviewData: PropTypes.object.isRequired,
};

const DashboardReview = (props) => {
	const [localReviewData, setLocalReviewData] = useState(props.reviewData);
	const [isClosing, setIsClosing] = useState(false);
	const [isReleasing, setIsReleasing] = useState(false);
	const { loginData, scopeData, communityData } = usePageContext();
	const { author, status, thread, releaseRequested } = localReviewData;
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

	const isAuthor = loginData && loginData.id === author.id;
	const canClose = isAuthor || canAdmin;
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
						<a href={`/user/${author.slug}`}>{author.fullName}</a> created this review{' '}
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
			<Thread threadData={thread} />
			<ThreadInput
				parentId={localReviewData.id}
				pubId={localReviewData.pubId}
				threadData={thread}
				onThreadUpdate={onThreadUpdate}
			/>
			{canAdmin && status === 'open' && releaseRequested && (
				<Callout intent={Intent.WARNING} icon="document-open" title="Publication Requested">
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

DashboardReview.propTypes = propTypes;
export default DashboardReview;
