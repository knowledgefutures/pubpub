import React, { useState } from 'react';
import { Button, EditableText, InputGroup } from '@blueprintjs/core';

import { Collection, SubmissionWorkflow } from 'types';
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
	isValidBannerContent,
	validate,
} from './validators';

require('./submissionWorkflowEditor.scss');

type Props = {
	collection: Collection;
	onUpdateWorkflow: (workflow: EditableSubmissionWorkflow) => unknown;
	renderCompletionButton: (isValid: boolean) => React.ReactNode;
	workflow: EditableSubmissionWorkflow;
};

const validator: RecordValidator<EditableSubmissionWorkflow> = {
	instructionsText: isValidDocJson,
	emailText: isValidDocJson,
	targetEmailAddress: isValidEmail,
	enabled: isAlwaysValid,
	layoutBlockContent: isValidBannerContent,
};

const SubmissionWorkflowEditor = (props: Props) => {
	const { collection, onUpdateWorkflow, renderCompletionButton, workflow } = props;
	const { communityData } = usePageContext();
	const { email: communityEmail } = communityData;
	const { layoutBlockContent } = workflow;
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
		onUpdateWorkflow(nextWorkflow);
	};

	const updateBannerContent = (update: Partial<SubmissionWorkflow['layoutBlockContent']>) => {
		updateWorkflow({ layoutBlockContent: { ...layoutBlockContent, ...update } });
	};

	return (
		<div className="submission-workflow-editor-component">
			<Step
				className="banner-step"
				number={1}
				title="Invite submitters from this Collection's landing page"
				done={fieldValidStates.layoutBlockContent}
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
							placeholder="Click to add banner title"
							value={layoutBlockContent.title}
							onChange={(title) => updateBannerContent({ title })}
						/>
					}
					content={
						<WorkflowTextEditor
							placeholder="Banner content"
							initialContent={layoutBlockContent.body}
							onContent={(body) => updateBannerContent({ body })}
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
				className="email-step"
				number={3}
				title="Send an email for completed submissions"
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
					community={communityData}
					from="submissions@pubpub.org"
					to="submitter.name@place.org"
					cc={workflow.targetEmailAddress}
					body={
						<WorkflowTextEditor
							placeholder="Custom email text"
							initialContent={workflow.emailText}
							onContent={(content) => updateWorkflow({ emailText: content })}
						/>
					}
				/>
				<p>{renderCompletionButton(isValid)}</p>
			</Step>
		</div>
	);
};

export default SubmissionWorkflowEditor;
