import React from 'react';
import PropTypes from 'prop-types';
import { usePageContext } from 'utils/hooks';

require('./dashboardSettings.scss');

const propTypes = {};

const DashboardSettings = (props) => {
	const { scopeData } = usePageContext();

	return (
		<div className="dashboard-settings-container">
			<h2 className="dashboard-content-header">
				{scopeData.elements.activeTargetName} Settings
			</h2>
		</div>
	);
};

DashboardSettings.propTypes = propTypes;
export default DashboardSettings;
