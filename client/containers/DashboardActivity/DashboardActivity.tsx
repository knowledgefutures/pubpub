import React from 'react';
import { usePageContext } from 'utils/hooks';

require('./dashboardActivity.scss');

type Props = {
	activityData: any;
};

const DashboardActivity = (props: Props) => {
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
export default DashboardActivity;
