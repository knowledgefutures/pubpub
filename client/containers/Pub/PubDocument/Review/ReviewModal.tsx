import React from 'react';
import { Button } from '@blueprintjs/core';

import { DialogLauncher } from 'components';
import { PubPageData } from 'types';

import ReviewerDialog from './ReviewerDialog';

type Props = {
	isLoading: boolean;
	pubData: PubPageData;

	reviewTitle: string;
	setReviewTitle: React.Dispatch<React.SetStateAction<string>>;
	isUser: boolean;
	setReviewerName: React.Dispatch<React.SetStateAction<string>>;
	reviewerName: string;
	onSubmit: any;
};

const ReviewModal = (props: Props) => {
	const {
		isLoading,
		pubData,
		reviewTitle,
		setReviewTitle,
		isUser,
		setReviewerName,
		reviewerName,
		onSubmit,
	} = props;

	return (
		<div>
			<DialogLauncher
				renderLauncherElement={({ openDialog }) => (
					<Button
						icon="document-share"
						onClick={openDialog}
						minimal={true}
						loading={isLoading}
					>
						Submit Review
					</Button>
				)}
			>
				{({ isOpen, onClose, key }) => (
					<ReviewerDialog
						key={key}
						isOpen={isOpen}
						onClose={onClose}
						pubData={pubData}
						onCreateReviewDoc={onSubmit}
						setReviewTitle={setReviewTitle}
						reviewTitle={reviewTitle}
						reviewerName={reviewerName}
						setReviewerName={setReviewerName}
						isUser={isUser}
					/>
				)}
			</DialogLauncher>
		</div>
	);
};

export default ReviewModal;
