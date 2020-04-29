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

	void activityData;
	void scopeData;

	return (
		<div className="dashboard-activity-container">
			<div className="dashboard-content-header">
				<div className="name">Activity</div>
			</div>
		</div>
	);
};

DashboardActivity.propTypes = propTypes;
export default DashboardActivity;
