import React from 'react';
import { AnchorButton, Callout, Classes, Dialog, InputGroup } from '@blueprintjs/core';
import { PubPageData } from 'types';

require('./reviewerDialog.scss');

type Props = {
	isOpen: boolean;
	pubData: PubPageData;
	onClose: (...args: any[]) => any;
	onCreateReviewDoc: () => void;
	setReviewTitle: React.Dispatch<React.SetStateAction<string>>;
	reviewTitle: string;
	reviewerName: string;
	setReviewerName: React.Dispatch<React.SetStateAction<string>>;
	createdReview: boolean;
	createError: any;
	isUser: boolean;
	reviewerFooterButtons: React.ReactNode;
};

const ReviewerDialog = (props: Props) => {
	const {
		isOpen,
		onClose,
		pubData,
		onCreateReviewDoc,
		setReviewTitle,
		reviewTitle,
		reviewerName,
		setReviewerName,
		createdReview,
		createError,
		isUser,
		reviewerFooterButtons,
	} = props;

	const handleTitleOnBlur = (evt) => setReviewTitle(evt.target.value.trim());
	const handleReviewerNameOnBlur = (evt) => setReviewerName(evt.target.value.trim());
	const handleKeyDown = (evt) => {
		if (evt.key === 'Enter') {
			evt.currentTarget.blur();
		}
	};

	const renderDialog = () => {
		return (
			<React.Fragment>
				<div className={Classes.DIALOG_BODY}>
					<div className="title-input">
						<p>Add a title to your review?</p>
						<InputGroup
							defaultValue={reviewTitle}
							onKeyDown={handleKeyDown}
							onBlur={handleTitleOnBlur}
						/>
					</div>
					{!isUser && (
						<div className="title-input">
							<p>Add your name?</p>
							<InputGroup
								defaultValue={reviewerName}
								onKeyDown={handleKeyDown}
								onBlur={handleReviewerNameOnBlur}
							/>
						</div>
					)}
					<p>
						You are about to submit a review for <b>{pubData.title}</b>.
					</p>
				</div>
				<div className={Classes.DIALOG_FOOTER}>
					<div className={Classes.DIALOG_FOOTER_ACTIONS}>
						<AnchorButton onClick={onClose}>Cancel</AnchorButton>
						<AnchorButton intent="primary" onClick={onCreateReviewDoc}>
							Create Review
						</AnchorButton>
					</div>
				</div>
			</React.Fragment>
		);
	};

	const renderSuccess = () => {
		return (
			<React.Fragment>
				<div className={Classes.DIALOG_BODY}>
					<div className="callout">
						<Callout intent="success" title="Created Review!">
							Your review was successfully submitted!
						</Callout>
					</div>
				</div>
				<div className={Classes.DIALOG_FOOTER}>
					<div className={Classes.DIALOG_FOOTER_ACTIONS}>{reviewerFooterButtons}</div>
				</div>
			</React.Fragment>
		);
	};

	return (
		<Dialog
			lazy={true}
			title="Create Review"
			onClose={onClose}
			isOpen={isOpen}
			className="reviewer-dialog"
		>
			{createdReview ? renderSuccess() : renderDialog()}

			<div className="callout">
				{createError && (
					<Callout intent="danger" title="There was an error submitting your review">
						Your review was not successfully submitted!
					</Callout>
				)}
			</div>
		</Dialog>
	);
};

export default ReviewerDialog;
