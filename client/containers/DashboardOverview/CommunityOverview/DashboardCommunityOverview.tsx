import React from 'react';

import { DashboardFrame } from 'components';
import { Collection, Pub, UserScopeVisit } from 'utils/types';

import { usePageContext } from 'utils/hooks';
import { getDashUrl } from 'utils/dashboard';

import CommunityItems from './CommunityItems';
import {
	OverviewFrame,
	OverviewSection,
	ScopeSummaryList,
	RecentVisitList,
	QuickActions,
	QuickAction,
} from '../helpers';

type Props = {
	overviewData: {
		collections: Collection[];
		pubs: Pub[];
		includesAllPubs: boolean;
		userScopeVisits: UserScopeVisit[];
		recentPubs: Pub[];
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
	const { pubs, recentPubs, userScopeVisits, collections, includesAllPubs } = overviewData;
	const {
		communityData,
		scopeData: {
			activePermissions: { canManage },
		},
	} = usePageContext();

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
						{userScopeVisits.length > 0 && (
							<OverviewSection title="recently viewed">
								<RecentVisitList
									userScopeVisits={userScopeVisits}
									pubs={recentPubs}
									collections={collections}
								/>
							</OverviewSection>
						)}
						{canManage && (
							<OverviewSection title="Quick Actions" spaced>
								<QuickActions actions={quickActions} />
							</OverviewSection>
						)}
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
