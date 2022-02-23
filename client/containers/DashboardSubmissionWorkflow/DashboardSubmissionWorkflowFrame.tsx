import React from 'react';

import { DashboardFrame } from 'components';

type Props = Omit<React.ComponentProps<typeof DashboardFrame>, 'className' | 'title' | 'icon'>;

const DashboardSubmissionWorkflowFrame = (props: Props) => {
	return (
		<DashboardFrame
			{...props}
			className="dashboard-submission-workflow-container"
			title="Submission Workflow"
			icon="manually-entered-data"
		/>
	);
};

export default DashboardSubmissionWorkflowFrame;
