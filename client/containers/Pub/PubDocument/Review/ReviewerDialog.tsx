import React from 'react';
import { Button, Classes, Dialog, InputGroup } from '@blueprintjs/core';
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
	isUser: boolean;
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
		isUser,
	} = props;

	const renderPreReviewButtons = () => {
		return (
			<React.Fragment>
				<Button onClick={onClose}>Cancel</Button>
				<Button intent="primary" onClick={onCreateReviewDoc}>
					Create Review
				</Button>
			</React.Fragment>
		);
	};

	const handleTitleOnBlur = (evt) => setReviewTitle(evt.target.value.trim());
	const handleReviewerNameOnBlur = (evt) => setReviewerName(evt.target.value.trim());
	const handleKeyDown = (evt) => {
		if (evt.key === 'Enter') {
			evt.currentTarget.blur();
		}
	};
	return (
		<Dialog
			lazy={true}
			title="Create Review"
			onClose={onClose}
			isOpen={isOpen}
			className="pub-release-review-dialog-component"
		>
			<div className={Classes.DIALOG_BODY}>
				<div className="reviewer-dialog">
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
			</div>
			<div className={Classes.DIALOG_FOOTER}>
				<div className={Classes.DIALOG_FOOTER_ACTIONS}>{renderPreReviewButtons()}</div>
			</div>
		</Dialog>
	);
};

export default ReviewerDialog;
