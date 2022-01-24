import React, { useState } from 'react';

import { DashboardFrame } from 'components';
import { usePageContext } from 'utils/hooks';
import { Pub, SubmissionWorkflow, DefinitelyHas } from 'types';

import SubmissionItems from './SubmissionItems';
import AcceptSubmissionsToggle from './AcceptSubmissionsToggle';
import SubmissionWorkflowButton from './SubmissionWorkflowButton';

require('./dashboardSubmissions.scss');

type Props = {
	initialPubs: Pub[];
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
				initialPubs={initialPubs as DefinitelyHas<Pub, 'submission'>[]}
				collection={activeCollection}
				initiallyLoadedAllPubs={initiallyLoadedAllPubs}
			/>
		</DashboardFrame>
	);
};

export default DashboardSubmissions;
