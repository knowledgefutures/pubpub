import React, { useState } from 'react';
import { Callout, Button, Dialog, Classes, Checkbox } from '@blueprintjs/core';

import { DefinitelyHas, SubmissionStatus, Pub, DocJson } from 'types';
import { Icon } from 'components';
import { getEmptyDoc } from 'client/components/Editor/utils/doc';
import WorkflowTextEditor from '../DashboardSubmissionWorkflow/WorkflowTextEditor';

require('./verdictDialog.scss');

type Props = {
	isOpen: boolean;
	shouldOfferEmail?: boolean;
	onClose: () => unknown;
	actionTitle: string;
	completedName: string;
	onSubmit: (customEmailText?: DocJson, shouldSendEmail?: boolean) => any;
	status: SubmissionStatus;
	initialEmailText?: DocJson;
	pub: DefinitelyHas<Pub, 'submission'>;
	onJudgePub: (pubId: string, status: SubmissionStatus) => void;
};

type PreStatusChangeBodyProps = {
	shouldOfferEmail: boolean;
	handleSubmission: (customEmailText: DocJson, shouldSendEmail: boolean) => void;
	isHandlingSubmission: boolean;
	actionTitle: string;
	onClose: () => unknown;
	initialEmailText?: DocJson;
};

const PreStatusChangeBody = (props: PreStatusChangeBodyProps) => {
	const [shouldSendEmail, setShouldSendEmail] = useState(!!props.initialEmailText);
	const [customEmailText, setCustomEmailText] = useState(
		() => props.initialEmailText || getEmptyDoc(),
	);
	return (
		<>
			<div className={Classes.DIALOG_BODY}>
				<p>Would you like to {props.actionTitle.toLowerCase()} this submission?</p>
				{props.shouldOfferEmail && (
					<>
						<p className="email-text-header">
							<Icon icon="manually-entered-data" iconSize={12} />
							{'  '}Email to submitters
						</p>
						<WorkflowTextEditor
							initialContent={customEmailText}
							onContent={setCustomEmailText}
							placeholder="Specify message to submitter(s)."
						/>
					</>
				)}
			</div>
			<div className={Classes.DIALOG_FOOTER}>
				<div className={Classes.DIALOG_FOOTER_ACTIONS}>
					{props.shouldOfferEmail && (
						<Checkbox
							className="email-toggle"
							checked={shouldSendEmail}
							disabled={props.isHandlingSubmission}
							onChange={(e) => {
								setShouldSendEmail((e.target as HTMLInputElement).checked);
							}}
							label="Notify submitters by email"
						/>
					)}
					<Button onClick={props.onClose} disabled={props.isHandlingSubmission}>
						Cancel
					</Button>
					<Button
						onClick={() => props.handleSubmission(customEmailText, shouldSendEmail)}
						loading={props.isHandlingSubmission}
						intent="primary"
					>
						{props.shouldOfferEmail && shouldSendEmail && 'Email & '}
						{props.actionTitle}
					</Button>
				</div>
			</div>
		</>
	);
};

type PostStatusChangeBodyProps = {
	completedName: string;
	onClose: () => unknown;
	isHandlingSubmission: boolean;
};
const PostStatusChangeBody = (props: PostStatusChangeBodyProps) => (
	<>
		<div className={Classes.DIALOG_BODY}>
			<Callout intent="success" title={`Submission ${props.completedName}!`}>
				You successfully {props.completedName} the submission!
			</Callout>
		</div>
		<div className={Classes.DIALOG_FOOTER}>
			<div className={Classes.DIALOG_FOOTER_ACTIONS}>
				<Button onClick={props.onClose} disabled={props.isHandlingSubmission}>
					Close
				</Button>
			</div>
		</div>
	</>
);

const VerdictDialog = (props: Props) => {
	const [isHandlingSubmission, setIsHandlingSubmission] = useState(false);
	const [updatedSubmission, setUpdatedSubmission] = useState(null);
	const [submissionError, setSubmissionError] = useState(null);
	const onSubmit = (customEmailText: DocJson, shouldSendEmail: boolean) => {
		setIsHandlingSubmission(true);
		props
			.onSubmit(customEmailText, shouldSendEmail)
			.then((submissionRes) => {
				setUpdatedSubmission(submissionRes);
				setIsHandlingSubmission(false);
			})
			.then(() => props.onJudgePub(props.pub.id, props.status))
			.catch((err) => {
				setSubmissionError(err);
				setIsHandlingSubmission(false);
			});
	};
	return (
		<Dialog
			lazy={true}
			title={props.actionTitle}
			className="verdict-dialog-component"
			isOpen={props.isOpen}
			onClose={props.onClose}
		>
			{submissionError ? (
				<Callout intent="warning" title="There was an error updating this submission." />
			) : updatedSubmission ? (
				<PostStatusChangeBody
					isHandlingSubmission={isHandlingSubmission}
					completedName={props.completedName}
					onClose={props.onClose}
				/>
			) : (
				<PreStatusChangeBody
					shouldOfferEmail={!!props.shouldOfferEmail}
					onClose={props.onClose}
					handleSubmission={onSubmit}
					initialEmailText={props.initialEmailText}
					isHandlingSubmission={isHandlingSubmission}
					actionTitle={props.actionTitle}
				/>
			)}
		</Dialog>
	);
};

export default VerdictDialog;
