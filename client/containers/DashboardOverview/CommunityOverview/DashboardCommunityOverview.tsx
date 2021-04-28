import React from 'react';

import { DashboardFrame } from 'components';
import { Collection, Pub } from 'utils/types';

import { usePageContext } from 'utils/hooks';
import CommunityItems from './CommunityItems';
import { OverviewFrame, OverviewSection, ScopeSummaryList } from '../helpers';

type Props = {
	overviewData: {
		collections: Collection[];
		pubs: Pub[];
		includesAllPubs: boolean;
	};
};

const DashboardCommunityOverview = (props: Props) => {
	const { overviewData } = props;
	const { pubs, collections, includesAllPubs } = overviewData;
	const { communityData } = usePageContext();

	return (
		<DashboardFrame title="Overview">
			<OverviewFrame
				primary={
					<OverviewSection title="Explore" icon="overview" descendTitle>
						<CommunityItems
							initialPubs={pubs}
							collections={collections}
							initiallyLoadedAllPubs={includesAllPubs}
						/>
					</OverviewSection>
				}
				secondary={
					<OverviewSection title="About">
						<ScopeSummaryList scope={communityData} scopeKind="community" />
					</OverviewSection>
				}
			/>
		</DashboardFrame>
	);
};

export default DashboardCommunityOverview;
