import React, { useContext, useState } from 'react';
import dateFormat from 'dateformat';
import { Tag, Button, Intent } from '@blueprintjs/core';
import { pubDataProps } from 'types/pub';
import { GridWrapper } from 'components';
import { PageContext } from 'components/PageWrapper/PageWrapper';
import { apiFetch } from 'utils';

require('./pubReviews.scss');

const propTypes = {
	pubData: pubDataProps.isRequired,
};

const PubReviews = (props) => {
	const { pubData } = props;
	const { communityData } = useContext(PageContext);
	const [isLoading, setIsLoading] = useState(false);

	const mergeBranch = (reviewId, sourceBranch, destinationBranch) => {
		setIsLoading(true);
		return apiFetch('/api/reviews/accept', {
			method: 'POST',
			body: JSON.stringify({
				reviewId: reviewId,
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
				return (
					<div className="review-row" key={review.id}>
						<div>
							<b>{review.shortId}</b>
						</div>
						<div>
							{sourceBranch.title} -> {destinationBranch.title}
						</div>
						<div className="expand">{dateFormat(review.createdAt, 'mmm dd, yyyy')}</div>

						{!review.isClosed && (
							<div>
								<Button
									text="Accept and Merge"
									loading={isLoading}
									onClick={() => {
										mergeBranch(review.id, sourceBranch, destinationBranch);
									}}
								/>
							</div>
						)}
						<div>
							<Tag
								minimal={true}
								large={true}
								intent={review.isClosed ? Intent.DANGER : Intent.SUCCESS}
							>
								{review.isClosed ? 'Closed' : 'Open'}
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
