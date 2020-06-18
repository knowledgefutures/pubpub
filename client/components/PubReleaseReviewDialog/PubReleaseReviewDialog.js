import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { AnchorButton, Button, Callout, Classes, Dialog } from '@blueprintjs/core';

import { MinimalEditor } from 'components';
import { usePageContext } from 'utils/hooks';
import { apiFetch } from 'client/utils/apiFetch';

require('./pubReleaseReviewDialog.scss');

const propTypes = {
	historyData: PropTypes.shape({ latestKey: PropTypes.number }).isRequired,
	isOpen: PropTypes.bool.isRequired,
	pubData: PropTypes.shape({
		id: PropTypes.string,
		releases: PropTypes.arrayOf(PropTypes.shape({})),
		slug: PropTypes.string,
		branches: PropTypes.array,
	}).isRequired,
	onClose: PropTypes.func.isRequired,
	updatePubData: PropTypes.func.isRequired,
};

const defaultProps = {};

const PubReleaseReviewDialog = (props) => {
	const { isOpen, onClose, pubData, updatePubData } = props;
	const { communityData } = usePageContext();
	const [noteData, setNoteData] = useState({});
	const [isCreatingReview, setIsCreatingReview] = useState(false);
	const [createdReview, setCreatedReview] = useState(false);
	const [releaseError, setReviewError] = useState(null);

	const handleCreateRelease = () => {
		setIsCreatingReview(true);
		apiFetch('/api/reviews', {
			method: 'POST',
			body: JSON.stringify({
				communityId: communityData.id,
				pubId: pubData.id,
				content: noteData.content,
				text: noteData.text,
				releaseRequested: true,
			}),
		})
			.then((review) => {
				setReviewError(null);
				setCreatedReview(review);
				setIsCreatingReview(false);
				updatePubData((currentPubData) => {
					return {
						reviews: [...currentPubData.reviews, review],
					};
				});
			})
			.catch((err) => {
				setReviewError(err);
				setIsCreatingReview(false);
			});
	};

	const renderReviewResult = () => {
		if (releaseError) {
			return <Callout intent="warning" title="There was an error creating this review." />;
		}
		if (createdReview) {
			return (
				<Callout intent="success" title="Created Review!">
					Your Review requesting publication was succesfully created!
				</Callout>
			);
		}
		return null;
	};

	const renderPreReviewButtons = () => {
		return (
			<React.Fragment>
				<Button disabled={isCreatingReview} onClick={onClose}>
					Cancel
				</Button>
				<Button loading={isCreatingReview} intent="primary" onClick={handleCreateRelease}>
					Create Review
				</Button>
			</React.Fragment>
		);
	};

	const renderPostReviewButtons = () => {
		return (
			<React.Fragment>
				<Button onClick={onClose}>Close</Button>
				<AnchorButton
					intent="primary"
					href={`/dash/pub/${pubData.slug}/reviews/${createdReview.number}`}
				>
					Go to Review
				</AnchorButton>
			</React.Fragment>
		);
	};

	return (
		<Dialog
			lazy={true}
			title="Request Publication"
			onClose={onClose}
			isOpen={isOpen}
			className="pub-release-review-dialog-component"
		>
			<div className={Classes.DIALOG_BODY}>
				{!createdReview && (
					<React.Fragment>
						<p>
							To request publication, you can create a Review that will be sent to the
							community managers.
						</p>

						<MinimalEditor
							onChange={(data) => {
								setNoteData(data);
							}}
							focusOnLoad={true}
							placeholder="Add a note for the community managers."
						/>
					</React.Fragment>
				)}
				{renderReviewResult()}
			</div>
			<div className={Classes.DIALOG_FOOTER}>
				<div className={Classes.DIALOG_FOOTER_ACTIONS}>
					{createdReview && renderPostReviewButtons()}
					{!createdReview && renderPreReviewButtons()}
				</div>
			</div>
		</Dialog>
	);
};

PubReleaseReviewDialog.propTypes = propTypes;
PubReleaseReviewDialog.defaultProps = defaultProps;
export default PubReleaseReviewDialog;
