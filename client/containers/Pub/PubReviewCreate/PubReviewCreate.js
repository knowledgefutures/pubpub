import React, { useContext, useState } from 'react';
import { AnchorButton, Button, Intent, NonIdealState, Tag, Tabs, Tab } from '@blueprintjs/core';
import { pubDataProps } from 'types/pub';
import { GridWrapper, InputField, Icon } from 'components';
import { PageContext } from 'components/PageWrapper/PageWrapper';
import { apiFetch } from 'utils';

require('./pubReviewCreate.scss');

const propTypes = {
	pubData: pubDataProps.isRequired,
};

const PubReviewCreate = (props) => {
	const { pubData } = props;
	const { locationData, communityData } = useContext(PageContext);
	const [isLoading, setIsLoading] = useState(false);
	const [currentTab, setCurrentTab] = useState('details');
	const [noteText, setNoteText] = useState('');
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
				note: noteText,
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
			<div className="review-header">
				<h2>New Review</h2>
				<Tag minimal={true} large={true}>
					#{sourceBranch.title}{' '}
					<Icon icon="arrow-right" iconSize={14} className="merge-arrow" /> #
					{destinationBranch.title}
				</Tag>
			</div>

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
									text="Create Review"
									loading={isLoading}
									onClick={createReview}
								/>
							</div>
						}
					/>

					{/* <Tab id="doc" title="Document" panel={<div>Doc here</div>} /> */}
				</Tabs>
			)}
		</GridWrapper>
	);
};

PubReviewCreate.propTypes = propTypes;
export default PubReviewCreate;
