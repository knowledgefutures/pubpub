import React, { useState } from 'react';

import { DashboardFrame } from 'components';
import { usePageContext } from 'utils/hooks';
import { SubmissionWorkflow } from 'types';

import SubmissionItems from './SubmissionItems';
import AcceptSubmissionsToggle from './AcceptSubmissionsToggle';
import SubmissionWorkflowButton from './SubmissionWorkflowButton';
import { PubWithSubmission } from './types';

require('./dashboardSubmissions.scss');

type Props = {
	initialPubs: PubWithSubmission[];
	initiallyLoadedAllPubs: boolean;
	initialSubmissionWorkflow: SubmissionWorkflow;
};

const DashboardSubmissions = (props: Props) => {
	const { initialPubs, initiallyLoadedAllPubs, initialSubmissionWorkflow } = props;
	const [submissionWorkflow, setSubmissionWorkflow] = useState(initialSubmissionWorkflow);
	const {
		scopeData: {
			elements: { activeCollection },
		},
	} = usePageContext();

	return (
		<DashboardFrame
			className="dashboard-submissions-container"
			title="Submissions"
			icon="inbox"
			controls={
				<>
					<SubmissionWorkflowButton />
					<AcceptSubmissionsToggle
						workflow={submissionWorkflow}
						onUpdateWorkflow={(next) =>
							setSubmissionWorkflow((current) => ({ ...current, ...next }))
						}
					/>
				</>
			}
		>
			<SubmissionItems
				initialPubs={initialPubs}
				collection={activeCollection}
				initiallyLoadedAllPubs={initiallyLoadedAllPubs}
			/>
		</DashboardFrame>
	);
};

export default DashboardSubmissions;
