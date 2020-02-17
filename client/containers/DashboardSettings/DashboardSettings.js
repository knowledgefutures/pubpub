import React from 'react';
import PropTypes from 'prop-types';
import { usePageContext } from 'utils/hooks';

require('./dashboardSettings.scss');

const propTypes = {
	settingsData: PropTypes.object.isRequired,
};

const DashboardSettings = (props) => {
	const { settingsData } = props;
	const { scopeData } = usePageContext();

	return (
		<div className="dashboard-settings-container">
			<h2 className="dashboard-content-header">Settings</h2>
		</div>
	);
};

DashboardSettings.propTypes = propTypes;
export default DashboardSettings;
