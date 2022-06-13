import React, { useEffect, useState } from 'react';
import { Button, Checkbox, FormGroup, InputGroup, Label, TagInput } from '@blueprintjs/core';

import { Collection } from 'types';
import { LayoutSubmissionBannerSkeleton } from 'client/components/Layout';
import { usePageContext } from 'utils/hooks';
import { withValue } from 'utils/fp';
import { collectionUrl } from 'utils/canonicalUrls';
import {
	RecordValidator,
	isValidEmailList,
	isNonEmptyDocJson,
	isNonEmptyString,
	isAlwaysValid,
	validate,
} from 'utils/validate';

import WorkflowTextEditor from './WorkflowTextEditor';
import EmailPreview from './EmailPreview';
import SubmissionWorkflowStepPicker from './SubmissionWorkflowStepPicker';
import {
	EditableSubmissionWorkflow,
	SubmissionWorkflowConfigStep,
	submissionWorkflowConfigSteps,
	submissionWorkflowConfigStepLabels,
} from './types';

require('./submissionWorkflowEditor.scss');

type Props = {
	collection: Collection;
	onUpdateWorkflow: (workflow: Partial<EditableSubmissionWorkflow>) => unknown;
	onValidateWorkflow: (isValid: boolean) => unknown;
	workflow: EditableSubmissionWorkflow;
	finalStepButton?: React.ReactNode;
};

const validator: RecordValidator<EditableSubmissionWorkflow> = {
	title: isNonEmptyString,
	introText: isNonEmptyDocJson,
	instructionsText: isNonEmptyDocJson,
	receivedEmailText: isAlwaysValid,
	acceptedText: isAlwaysValid,
	declinedText: isAlwaysValid,
	targetEmailAddresses: isValidEmailList,
	enabled: isAlwaysValid,
	requireAbstract: isAlwaysValid,
	requireDescription: isAlwaysValid,
};

const youCanLeaveItBlank = <>You can leave it blank if you don't have anything you want to add.</>;

const SubmissionWorkflowEditor = (props: Props) => {
	const {
		collection,
		onUpdateWorkflow,
		onValidateWorkflow,
		workflow,
		finalStepButton = null,
	} = props;
	const { communityData } = usePageContext();
	const { email: communityEmail } = communityData;
	const [step, setStep] = useState<SubmissionWorkflowConfigStep>('instructions-requirements');
	const [{ validatedFields, isValidated }, setValidation] = useState(() =>
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
		from: 'submissions@mg.pubpub.org',
		to: 'submitter.name@place.org',
		cc: workflow.targetEmailAddresses,
	};

	useEffect(() => void onValidateWorkflow(isValidated), [onValidateWorkflow, isValidated]);

	const renderInstructionsRequirements = () => {
		const currentYear = new Date().getFullYear().toString();
		return (
			<>
				<Label>
					<h2>Workflow title</h2>
					<p>
						For example, <i>Summer {currentYear} Special Issue: Call for Submissions</i>
						. Submitters will see this, not the Collection title.
					</p>
					<InputGroup
						large
						onChange={(e) => updateWorkflow({ title: e.target.value })}
						value={workflow.title}
						placeholder="Call for Submissions"
					/>
				</Label>
				<h2>Detailed submission instructions</h2>
				<p>
					...for content, formatting, etc. Submitters will be able to refer to these at
					any time.
				</p>
				<WorkflowTextEditor
					placeholder="Detailed submission instructions"
					initialContent={workflow.instructionsText}
					onContent={(content) => updateWorkflow({ instructionsText: content })}
				/>
				<h2>Submission requirements</h2>
				<FormGroup
					helperText={<>We'll merge the abstract into the Pub when it is submitted.</>}
				>
					<Checkbox
						label="Require an abstract"
						checked={workflow.requireAbstract}
						onChange={() =>
							updateWorkflow({ requireAbstract: !workflow.requireAbstract })
						}
					/>
				</FormGroup>
				<FormGroup
					helperText={
						<>
							A short editorial subtitle shown in the Pub header and in links to the
							Pub. You may want this for relatively self-serve workflows.
						</>
					}
				>
					<Checkbox
						label="Require a description"
						checked={workflow.requireDescription}
						onChange={() =>
							updateWorkflow({ requireDescription: !workflow.requireDescription })
						}
					/>
				</FormGroup>
			</>
		);
	};

	const renderEmails = () => {
		return (
			<div className="email-step">
				<h2>Email correspondence addresses</h2>
				<p>
					Once a submission is completed, PubPub will email the submitter with an
					automated response and CC these addresses (that you control):
				</p>
				<div className="target-email-input">
					<TagInput
						values={workflow.targetEmailAddresses}
						intent={
							workflow.targetEmailAddresses && !validatedFields.targetEmailAddresses
								? 'danger'
								: undefined
						}
						placeholder="Submissions email address(es)"
						onChange={(emails) =>
							updateWorkflow({ targetEmailAddresses: emails as string[] })
						}
						addOnBlur
					/>
					{communityEmail && (
						<Button
							disabled={workflow.targetEmailAddresses.indexOf(communityEmail) >= 0}
							onClick={() =>
								updateWorkflow({
									targetEmailAddresses: [
										...workflow.targetEmailAddresses,
										communityEmail,
									],
								})
							}
						>
							Use {communityEmail}
						</Button>
					)}
				</div>
				<h2>Automated submission response</h2>
				<p>
					You can customize the automated response here, perhaps with a note of thanks and
					an expected response time. {youCanLeaveItBlank}
				</p>
				<EmailPreview
					{...sharedEmailPreviewProps}
					kind="received"
					collectionTitle={collection.title}
					body={
						<WorkflowTextEditor
							placeholder="Custom email text"
							initialContent={workflow.receivedEmailText}
							onContent={(content) => updateWorkflow({ receivedEmailText: content })}
						/>
					}
				/>
				<h2>Acceptance email template</h2>
				<p>
					This is just a template that you'll be able to modify before sending each
					acceptance email. {youCanLeaveItBlank}
				</p>
				<EmailPreview
					{...sharedEmailPreviewProps}
					kind="accepted"
					collectionTitle={collection.title}
					body={
						<WorkflowTextEditor
							placeholder="Custom email text"
							initialContent={workflow.acceptedText}
							onContent={(content) => updateWorkflow({ acceptedText: content })}
						/>
					}
				/>
				<h2>Rejection email template</h2>
				<p>
					This is just a template that you'll be able to modify before sending each
					rejection email. {youCanLeaveItBlank}
				</p>
				<EmailPreview
					{...sharedEmailPreviewProps}
					kind="declined"
					collectionTitle={collection.title}
					body={
						<WorkflowTextEditor
							placeholder="Custom email text"
							initialContent={workflow.declinedText}
							onContent={(content) => updateWorkflow({ declinedText: content })}
						/>
					}
				/>
			</div>
		);
	};

	const renderLayoutBanner = () => {
		return (
			<div className="banner-step">
				<h2>Layout banner text</h2>
				<p>
					Visitors to {collectionLink} will see a banner inviting them to submit to this
					Collection. You can add a brief description of your call for submissions here.
				</p>
				<LayoutSubmissionBannerSkeleton
					className="banner-skeleton"
					title={workflow.title}
					content={
						<>
							<WorkflowTextEditor
								placeholder="Banner content"
								initialContent={workflow.introText}
								onContent={(introText) => updateWorkflow({ introText })}
							/>
							<Button className="fake-submit-button">Create a submission</Button>
						</>
					}
				/>
			</div>
		);
	};

	const renderNextStepButton = () => {
		const currentStepIndex = submissionWorkflowConfigSteps.indexOf(step);
		const nextStep = submissionWorkflowConfigSteps[currentStepIndex + 1];
		if (nextStep) {
			const label = submissionWorkflowConfigStepLabels[nextStep];
			return (
				<Button
					minimal
					outlined
					rightIcon="arrow-right"
					intent="primary"
					onClick={() => setStep(nextStep)}
					className="next-step-button"
				>
					Next: <b>{label}</b>
				</Button>
			);
		}
		return finalStepButton;
	};

	return (
		<div className="submission-workflow-editor-component">
			<SubmissionWorkflowStepPicker
				selectedStep={step}
				onSelectStep={setStep}
				stepCompletions={{
					'instructions-requirements':
						validatedFields.title && validatedFields.instructionsText,
					'response-emails': validatedFields.targetEmailAddresses,
					'layout-banner': validatedFields.introText,
				}}
			/>
			<div className="step-content">
				{step === 'instructions-requirements' && renderInstructionsRequirements()}
				{step === 'response-emails' && renderEmails()}
				{step === 'layout-banner' && renderLayoutBanner()}
			</div>
			{renderNextStepButton()}
		</div>
	);
};

export default SubmissionWorkflowEditor;
