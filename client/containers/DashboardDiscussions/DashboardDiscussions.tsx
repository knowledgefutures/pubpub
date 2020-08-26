import React from 'react';
import { usePageContext } from 'utils/hooks';

require('./dashboardDiscussions.scss');

type Props = {
	discussionsData: any;
};

const DashboardDiscussions = (props: Props) => {
	const { discussionsData } = props;
	const { scopeData } = usePageContext();

	void discussionsData;
	void scopeData;

	return (
		<div className="dashboard-discussions-container">
			<h2 className="dashboard-content-header">Discussions</h2>
		</div>
	);
};
export default DashboardDiscussions;
