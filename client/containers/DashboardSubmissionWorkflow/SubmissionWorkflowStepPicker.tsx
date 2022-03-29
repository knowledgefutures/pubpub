import React, { useEffect } from 'react';
import classNames from 'classnames';
import { Tab, TabList, useTabState } from 'reakit/Tab';

import { Icon } from 'components';

import {
	SubmissionWorkflowConfigStep,
	submissionWorkflowConfigSteps,
	submissionWorkflowConfigStepLabels,
} from './types';

require('./submissionWorkflowStepPicker.scss');

type Props = {
	selectedStep: SubmissionWorkflowConfigStep;
	onSelectStep: (step: SubmissionWorkflowConfigStep) => unknown;
	stepCompletions: Record<SubmissionWorkflowConfigStep, boolean>;
};

const SubmissionWorkflowStepPicker = (props: Props) => {
	const { selectedStep, onSelectStep, stepCompletions } = props;
	const tabs = useTabState({ currentId: selectedStep });
	const { selectedId, select } = tabs;
	const selectedStepIndex = submissionWorkflowConfigSteps.indexOf(selectedStep);

	useEffect(() => {
		if (selectedStep !== selectedId) {
			select(selectedStep);
		}
	}, [selectedStep, selectedId, select]);

	return (
		<TabList
			{...tabs}
			className="submission-workflow-step-picker-component"
			aria-label="Workflow configuration steps"
		>
			{Object.entries(submissionWorkflowConfigStepLabels).map(([step, label], index) => {
				const reached = selectedStepIndex >= index;
				const passed = selectedStepIndex > index;
				const incomplete = passed && !stepCompletions[step];
				return (
					<Tab
						{...tabs}
						id={step}
						key={step}
						as="div"
						className={classNames(
							'step',
							reached && 'reached',
							incomplete && 'incomplete',
						)}
						stopId={step}
						onClick={() => onSelectStep(step as SubmissionWorkflowConfigStep)}
					>
						<div className="label">
							<div className="icon-container">
								{incomplete ? (
									<Icon icon="warning-sign" intent="warning" iconSize={22} />
								) : (
									<div className="number">{index + 1}</div>
								)}
							</div>
							{label}
						</div>
						<div className="progress-indicator" />
					</Tab>
				);
			})}
		</TabList>
	);
};

export default SubmissionWorkflowStepPicker;
