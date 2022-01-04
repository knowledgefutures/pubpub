import React from 'react';

import { DashboardFrame } from 'components';
import { usePageContext } from 'utils/hooks';
import { Pub } from 'types';

import SubmissionItems from './SubmissionItems';
import SubmissionWorkflowButton from './SubmissionWorkflowButton';

require('./dashboardSubmissions.scss');

type Props = {
	initialPubs: Pub[];
	initiallyLoadedAllPubs: boolean;
};

const DashboardSubmissions = (props: Props) => {
	const { initialPubs, initiallyLoadedAllPubs } = props;
	const { scopeData } = usePageContext();
	const collection = scopeData.elements.activeCollection;

	return (
		<DashboardFrame
			className="dashboard-submissions-container"
			title="Submissions"
			icon="inbox"
			controls={<SubmissionWorkflowButton />}
		>
			<SubmissionItems
				initialPubs={initialPubs}
				collection={collection}
				initiallyLoadedAllPubs={initiallyLoadedAllPubs}
			/>
		</DashboardFrame>
	);
};

export default DashboardSubmissions;
