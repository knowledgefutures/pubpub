import React, { useMemo } from 'react';
import pick from 'lodash.pick';

import { Community, PageContext } from 'types';
import { usePageContext, usePendingChanges } from 'utils/hooks';
import { getDashUrl } from 'utils/dashboard';
import { apiFetch } from 'client/utils/apiFetch';
import { usePersistableState } from 'client/utils/usePersistableState';

import DashboardSettingsFrame, { Subtab } from '../DashboardSettingsFrame';
import CommunityAdminSettings from './CommunityAdminSettings';
import PublicNewPubs from './PublicNewPubsSettings';
import BasicSettings from './BasicSettings';
import NavSettings from './NavSettings';
import HeaderSettings from './HeaderSettings';
import FooterSettings from './FooterSettings';
import HomepageBannerSettings from './HomepageBannerSettings';
import SocialSettings from './SocialSettings';
import CommunityOrCollectionLevelPubSettings from './CommunityOrCollectionLevelPubSettings';

const attributesRequiringRefresh = ['subdomain'];

const attributesToUpdateGlobally = [
	'accentColorDark',
	'accentColorLight',
	'headerColorType',
	'userHeaderTextAccent',
	'title',
];

const mustRefreshAfterPersist = (oldCommunity: Community, update: Partial<Community>) => {
	const newCommunity = { ...oldCommunity, ...update };
	return attributesRequiringRefresh.some((attr) => newCommunity[attr] !== oldCommunity[attr]);
};

const CommunitySettings = () => {
	const pageContext = usePageContext();
	const { pendingPromise } = usePendingChanges();
	const { communityData: initialCommunityData } = pageContext;

	const {
		state: communityData,
		hasChanges,
		update: updateCommunityData,
		persistedState: persistedCommunityData,
		persist,
	} = usePersistableState(initialCommunityData, async (update) => {
		await pendingPromise(
			apiFetch.put('/api/communities', {
				...update,
				communityId: communityData.id,
			}),
		);
		if (mustRefreshAfterPersist(persistedCommunityData, update)) {
			window.location.href = getDashUrl({ mode: 'settings' });
		}
		pageContext.updateCommunity(pick(update, attributesToUpdateGlobally));
	});

	const previewContext: PageContext = useMemo(() => {
		return {
			...pageContext,
			communityData: {
				...pageContext.communityData,
				...communityData,
			},
			locationData: {
				...pageContext.locationData,
				path: '/',
				queryString: '',
				params: {},
			},
			loginData: {
				id: null,
				isSuperAdmin: false,
			},
		};
	}, [pageContext, communityData]);

	const tabs: Subtab[] = [
		{
			id: 'details',
			title: 'Details',
			icon: 'settings',
			sections: [
				<BasicSettings
					communityData={communityData}
					updateCommunityData={updateCommunityData}
				/>,
				<SocialSettings
					communityData={communityData}
					updateCommunityData={updateCommunityData}
				/>,
				<CommunityAdminSettings />,
			],
		},
		{
			id: 'header',
			title: 'Header',
			icon: 'widget-header',
			sections: [
				<HeaderSettings
					communityData={communityData}
					updateCommunityData={updateCommunityData}
				/>,
				<HomepageBannerSettings
					communityData={communityData}
					updateCommunityData={updateCommunityData}
					previewContext={previewContext}
				/>,
			],
		},
		{
			id: 'navigation',
			title: 'Navigation',
			icon: 'link',
			sections: [
				<NavSettings
					communityData={communityData}
					updateCommunityData={updateCommunityData}
					previewContext={previewContext}
				/>,
			],
		},
		{
			id: 'footer',
			title: 'Footer',
			icon: 'widget-footer',
			sections: [
				<FooterSettings
					communityData={communityData}
					updateCommunityData={updateCommunityData}
					previewContext={previewContext}
				/>,
			],
		},
		{
			id: 'pub-settings',
			title: 'Pubs',
			pubPubIcon: 'pub',
			sections: [
				<PublicNewPubs
					communityData={communityData}
					updateCommunityData={updateCommunityData}
				/>,
				<CommunityOrCollectionLevelPubSettings />,
			],
		},
	];

	return (
		<DashboardSettingsFrame
			id="collection-settings"
			tabs={tabs}
			hasChanges={hasChanges}
			persist={persist}
		/>
	);
};

export default CommunitySettings;
