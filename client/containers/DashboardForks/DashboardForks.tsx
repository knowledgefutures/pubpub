import React from 'react';
import { usePageContext } from 'utils/hooks';

require('./dashboardForks.scss');

type Props = {
	forksData: any;
};

const DashboardForks = (props: Props) => {
	const { forksData } = props;
	const { scopeData } = usePageContext();

	void forksData;
	void scopeData;

	return (
		<div className="dashboard-forks-container">
			<h2 className="dashboard-content-header">Forks</h2>
		</div>
	);
};
export default DashboardForks;
