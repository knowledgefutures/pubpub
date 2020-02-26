import React from 'react';
import { usePageContext } from 'utils/hooks';
import { SettingsSection } from 'components';

const CollectionSettings = () => {
	const { scopeData } = usePageContext();

	return (
		<div className="collection-settings-component">
			<h2 className="dashboard-content-header">Collection Settings</h2>
			<SettingsSection title="example">Hello</SettingsSection>
		</div>
	);
};

export default CollectionSettings;
