import React from 'react';

import { usePageContext } from 'utils/hooks';

import CollectionSettings from './CollectionSettings';
import CommunitySettings from './CommunitySettings/CommunitySettings';
import PubSettings from './PubSettings';

import './dashboardSettings.scss';

const settingsComponents = {
	community: CommunitySettings,
	collection: CollectionSettings,
	pub: PubSettings,
};

const DashboardSettings = (props) => {
	const { scopeData } = usePageContext();
	const SettingsComponent = settingsComponents[scopeData.elements.activeTargetType];

	return (
		<div className="dashboard-settings-container">
			<SettingsComponent {...props} />
		</div>
	);
};

export default DashboardSettings;
