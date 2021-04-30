import React from 'react';

import { DashboardFrame } from 'components';
import { Collection, Pub } from 'utils/types';
import { usePageContext } from 'utils/hooks';
import { getDashUrl } from 'utils/dashboard';

import CommunityItems from './CommunityItems';
import {
	OverviewFrame,
	OverviewSection,
	ScopeSummaryList,
	QuickActions,
	QuickAction,
} from '../helpers';

type Props = {
	overviewData: {
		collections: Collection[];
		pubs: Pub[];
		includesAllPubs: boolean;
	};
};

const quickActions: QuickAction[] = [
	{
		label: 'Edit home page',
		icon: 'page-layout',
		href: getDashUrl({ mode: 'pages', subMode: 'home' }),
	},
	{
		label: 'Edit nav bar',
		icon: 'cog',
		href: getDashUrl({ mode: 'settings', section: 'navigation' }),
	},
	{
		label: 'Edit members/roles',
		icon: 'people',
		href: getDashUrl({ mode: 'members' }),
	},
];

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
					<>
						<OverviewSection title="Quick Actions" spaced>
							<QuickActions actions={quickActions} />
						</OverviewSection>
						<OverviewSection title="About">
							<ScopeSummaryList scope={communityData} scopeKind="community" />
						</OverviewSection>
					</>
				}
			/>
		</DashboardFrame>
	);
};

export default DashboardCommunityOverview;
