import React from 'react';

import { DashboardFrame } from 'components';
import { usePageContext } from 'utils/hooks';
import { Pub } from 'types';

import SubmissionItems from './SubmissionItems';
import SubmissionWorkflowButton from './SubmissionWorkflowButton';
import { OverviewSection } from '../DashboardOverview/helpers';

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
			title="Submissions Overview"
			icon="inbox"
			controls={<SubmissionWorkflowButton />}
		>
			<OverviewSection title="In this Collection" icon="overview" descendTitle>
				<SubmissionItems
					initialPubs={initialPubs}
					collection={collection}
					initiallyLoadedAllPubs={initiallyLoadedAllPubs}
				/>
			</OverviewSection>
		</DashboardFrame>
	);
};

export default DashboardSubmissions;
