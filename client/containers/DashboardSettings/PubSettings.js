import React from 'react';
import { usePageContext } from 'utils/hooks';
import { SettingsSection } from 'components';

const PubSettings = () => {
	const { scopeData } = usePageContext();

	return (
		<div className="pub-settings-component">
			<h2 className="dashboard-content-header">Pub Settings</h2>
			<SettingsSection title="example">Hello</SettingsSection>
		</div>
	);
};

export default PubSettings;
