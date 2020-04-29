import React from 'react';
import PropTypes from 'prop-types';
import { usePageContext } from 'utils/hooks';

require('./dashboardForks.scss');

const propTypes = {
	forksData: PropTypes.object.isRequired,
};

const DashboardForks = (props) => {
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

DashboardForks.propTypes = propTypes;
export default DashboardForks;
