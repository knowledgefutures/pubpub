import React from 'react';
import PropTypes from 'prop-types';
import { usePageContext } from 'utils/hooks';

require('./dashboardActivity.scss');

const propTypes = {
	activityData: PropTypes.object.isRequired,
};

const DashboardActivity = (props) => {
	const { activityData } = props;
	const { scopeData } = usePageContext();

	return (
		<div className="dashboard-activity-container">
			<h2 className="dashboard-content-header">Activity</h2>
		</div>
	);
};

DashboardActivity.propTypes = propTypes;
export default DashboardActivity;
