import React, { useEffect, useState } from 'react';
import { Button, EditableText, InputGroup, Tabs, Tab } from '@blueprintjs/core';

import { Collection } from 'types';
import { LayoutSubmissionBannerSkeleton } from 'client/components/Layout';
import { usePageContext } from 'utils/hooks';
import { isValidEmail } from 'utils/email';
import { withValue } from 'utils/fp';
import { collectionUrl } from 'utils/canonicalUrls';

import Step from './Step';
import WorkflowTextEditor from './WorkflowTextEditor';
import EmailPreview from './EmailPreview';
import { EditableSubmissionWorkflow } from './types';
import {
	RecordValidator,
	isValidDocJson,
	isAlwaysValid,
	validate,
	isValidTitle,
} from './validators';

require('./submissionWorkflowEditor.scss');

type Props = {
	collection: Collection;
	onUpdateWorkflow: (workflow: Partial<EditableSubmissionWorkflow>) => unknown;
	onValidateWorkflow: (isValid: boolean) => unknown;
	workflow: EditableSubmissionWorkflow;
};

const validator: RecordValidator<EditableSubmissionWorkflow> = {
	title: isValidTitle,
	introText: isValidDocJson,
	instructionsText: isValidDocJson,
	emailText: isValidDocJson,
	acceptedText: isAlwaysValid,
	declinedText: isAlwaysValid,
	targetEmailAddress: isValidEmail,
	enabled: isAlwaysValid,
};

const SubmissionWorkflowEditor = (props: Props) => {
	const { collection, onUpdateWorkflow, onValidateWorkflow, workflow } = props;
	const { communityData } = usePageContext();
	const { email: communityEmail } = communityData;
	const [{ fields: fieldValidStates, isValid }, setValidation] = useState(() =>
		validate(workflow, validator),
	);

	const collectionLink = withValue(collectionUrl(communityData, collection), (url) => (
		<a href={url} target="_blank" rel="noopener noreferrer">
			{url}
		</a>
	));

	const updateWorkflow = (update: Partial<EditableSubmissionWorkflow>) => {
		const nextWorkflow = { ...workflow, ...update };
		const nextValidation = validate(nextWorkflow, validator);
		setValidation(nextValidation);
		onUpdateWorkflow(update);
	};

	const sharedEmailPreviewProps = {
		community: communityData,
		from: 'submissions@pubpub.org',
		to: 'submitter.name@place.org',
		cc: workflow.targetEmailAddress,
	};

	useEffect(() => void onValidateWorkflow(isValid), [onValidateWorkflow, isValid]);

	return (
		<div className="submission-workflow-editor-component">
			<Step
				className="banner-step"
				number={1}
				title="Invite submitters from this Collection's landing page"
				done={fieldValidStates.title && fieldValidStates.introText}
			>
				<p>
					Visitors to {collectionLink} will see a banner inviting them to submit to this
					Collection.
				</p>
				<LayoutSubmissionBannerSkeleton
					className="banner-skeleton"
					title={
						<EditableText
							className="banner-title-text"
							placeholder='Click to add banner title (e.g. "Call for Submissions")'
							value={workflow.title}
							onChange={(title) => updateWorkflow({ title })}
						/>
					}
					content={
						<WorkflowTextEditor
							placeholder="Banner content"
							initialContent={workflow.introText}
							onContent={(introText) => updateWorkflow({ introText })}
						/>
					}
				/>
			</Step>
			<Step
				className="instructions-step"
				number={2}
				title="Add detailed submission instructions"
				done={fieldValidStates.instructionsText}
			>
				<p>
					Now provide instructions detailing any requirements for submissions to this
					Collection. Submitters will be able to refer to this text at any time.
				</p>
				<WorkflowTextEditor
					placeholder="Detailed submission instructions"
					initialContent={workflow.instructionsText}
					onContent={(content) => updateWorkflow({ instructionsText: content })}
				/>
			</Step>
			<Step
				number={3}
				title="Send an automated email when a submission is received"
				className="email-step"
				done={fieldValidStates.targetEmailAddress && fieldValidStates.emailText}
			>
				<p>
					When a submission is completed, PubPub will email the submitter and CC this
					address:
				</p>
				<div className="target-email-input">
					<InputGroup
						type="email"
						value={workflow.targetEmailAddress}
						intent={
							workflow.targetEmailAddress && !fieldValidStates.targetEmailAddress
								? 'danger'
								: undefined
						}
						placeholder="Submissions email address"
						onChange={(e) => updateWorkflow({ targetEmailAddress: e.target.value })}
					/>
					{communityEmail && (
						<Button
							disabled={workflow.targetEmailAddress === communityEmail}
							onClick={() => updateWorkflow({ targetEmailAddress: communityEmail })}
						>
							Use {communityEmail}
						</Button>
					)}
				</div>
				<p>
					You can customize the automated response here, perhaps with a note of thanks and
					an expected response time:
				</p>
				<EmailPreview
					{...sharedEmailPreviewProps}
					kind="received"
					body={
						<WorkflowTextEditor
							placeholder="Custom email text"
							initialContent={workflow.emailText}
							onContent={(content) => updateWorkflow({ emailText: content })}
						/>
					}
				/>
			</Step>
			<Step
				number={4}
				title="Create a template response for accepted and declined submissions"
				className="accept-reject-step"
				done={fieldValidStates.acceptedText && fieldValidStates.declinedText}
			>
				<p>
					These are just templates. You'll be able to customize the message you send
					before each accepted or declined submission.
				</p>
				<Tabs id="accepted-declined-email-templates">
					<Tab
						id="accepted"
						title="Accepted"
						panel={
							<EmailPreview
								{...sharedEmailPreviewProps}
								kind="accepted"
								body={
									<WorkflowTextEditor
										placeholder="Custom email text"
										initialContent={workflow.acceptedText}
										onContent={(content) =>
											updateWorkflow({ acceptedText: content })
										}
									/>
								}
							/>
						}
					/>
					<Tab
						id="declined"
						title="Declined"
						panel={
							<EmailPreview
								{...sharedEmailPreviewProps}
								kind="declined"
								body={
									<WorkflowTextEditor
										placeholder="Custom email text"
										initialContent={workflow.declinedText}
										onContent={(content) =>
											updateWorkflow({ declinedText: content })
										}
									/>
								}
							/>
						}
					/>
				</Tabs>
			</Step>
		</div>
	);
};

export default SubmissionWorkflowEditor;
