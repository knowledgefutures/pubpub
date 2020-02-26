import React from 'react';
import { usePageContext } from 'utils/hooks';
import CommunitySettings from './CommunitySettings';
import CollectionSettings from './CollectionSettings';
import PubSettings from './PubSettings';

require('./dashboardSettings.scss');

const DashboardSettings = () => {
	const { scopeData } = usePageContext();

	const settingsComponents = {
		community: <CommunitySettings />,
		collection: <CollectionSettings />,
		pub: <PubSettings />,
	};
	return (
		<div className="dashboard-settings-container">
			{settingsComponents[scopeData.elements.activeTargetType]}
		</div>
	);
};

export default DashboardSettings;
