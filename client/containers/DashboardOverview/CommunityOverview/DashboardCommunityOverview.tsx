import type { Collection, Pub, UserScopeVisit } from 'types';

import React, { useState } from 'react';

import { Button } from '@blueprintjs/core';

import { DashboardFrame, MobileAware } from 'components';
import { getDashUrl } from 'utils/dashboard';
import { usePageContext } from 'utils/hooks';

import CreateCollectionDialog from '../../App/Breadcrumbs/CreateCollectionDialog';
import {
	OverviewFrame,
	OverviewSection,
	type QuickAction,
	QuickActions,
	RecentVisitList,
	ScopeSummaryList,
} from '../helpers';
import CommunityItems from './CommunityItems';

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

	const [newCollectionIsOpen, setNewCollectionIsOpen] = useState(false);

	const renderMobileOnlyControls = () => {
		return (
			<MobileAware
				mobile={
					<div>
						<Button icon="plus" onClick={() => setNewCollectionIsOpen(true)} outlined>
							Create Collection
						</Button>
						<CreateCollectionDialog
							isOpen={newCollectionIsOpen}
							onClose={() => {
								setNewCollectionIsOpen(false);
							}}
						/>
					</div>
				}
			/>
		);
	};

	return (
		<DashboardFrame title="Overview" controls={canManage && renderMobileOnlyControls()}>
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
