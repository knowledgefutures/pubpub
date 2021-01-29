import React, { useState } from 'react';
import { AnchorButton, Button, Callout, Classes, Dialog } from '@blueprintjs/core';

import { MinimalEditor } from 'components';
import { usePageContext } from 'utils/hooks';
import { apiFetch } from 'client/utils/apiFetch';

require('./pubReleaseReviewDialog.scss');

type OwnProps = {
	isOpen: boolean;
	pubData: {
		id?: string;
		releases?: {}[];
		slug?: string;
	};
	onClose: (...args: any[]) => any;
	updatePubData: (...args: any[]) => any;
};

const defaultProps = {};

type Props = OwnProps & typeof defaultProps;

const PubReleaseReviewDialog = (props: Props) => {
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
				// @ts-expect-error ts-migrate(2339) FIXME: Property 'content' does not exist on type '{}'.
				content: noteData.content,
				// @ts-expect-error ts-migrate(2339) FIXME: Property 'text' does not exist on type '{}'.
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
					// @ts-expect-error ts-migrate(2339) FIXME: Property 'number' does not exist on type 'boolean'... Remove this comment to see the full error message
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
							onContent={setNoteData}
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
PubReleaseReviewDialog.defaultProps = defaultProps;
export default PubReleaseReviewDialog;
