import React, { useState } from 'react';
import { Switch, Popover } from '@blueprintjs/core';

import { ClientOnly, DashboardFrame } from 'components';

import NewSubmissionWorkflowEditor from './NewSubmissionWorkflowEditor';
import { EditableSubmissionWorkflow } from './types';

require('./dashboardSubmissions.scss');

const DashboardSubmissions = () => {
	const [workflow, setWorkflow] = useState<null | EditableSubmissionWorkflow>(null);
	const [showSwitchTooltip, setShowSwitchTooltip] = useState(false);

	const handleWorkflowCreated = (w: EditableSubmissionWorkflow) => {
		setWorkflow(w);
		setTimeout(() => setShowSwitchTooltip(true), 500);
	};

	const handleToggleSubmissionsEnabled = () => {
		if (workflow) {
			setWorkflow({ ...workflow, enabled: !workflow.enabled });
		}
		setShowSwitchTooltip(false);
	};

	const renderControls = () => {
		if (workflow) {
			const enabledSwitch = (
				<Switch large checked={workflow.enabled} onClick={handleToggleSubmissionsEnabled}>
					Accepting submissions
				</Switch>
			);
			if (showSwitchTooltip) {
				return (
					<Popover
						defaultIsOpen
						content={
							<div className="dashboard-submissions-container_accept-popover-content">
								<h5>Ready to accept submissions?</h5>
								When you're ready, you can enable submissions to this Collection
								here.
							</div>
						}
					>
						{enabledSwitch}
					</Popover>
				);
			}
			return enabledSwitch;
		}
		return null;
	};

	const renderNewWorkflowEditor = () => {
		return (
			<ClientOnly>
				<NewSubmissionWorkflowEditor onWorkflowCreated={handleWorkflowCreated} />
			</ClientOnly>
		);
	};

	return (
		<DashboardFrame
			className="dashboard-submissions-container"
			title="Submissions"
			icon="inbox"
			controls={renderControls()}
		>
			{!workflow && renderNewWorkflowEditor()}
		</DashboardFrame>
	);
};

export default DashboardSubmissions;
