import React from 'react';
import PropTypes from 'prop-types';
import { usePageContext } from 'utils/hooks';

require('./dashboardImpact.scss');

const propTypes = {
	impactData: PropTypes.object.isRequired,
};

const DashboardImpact = (props) => {
	const { impactData } = props;
	const { scopeData } = usePageContext();

	void impactData;
	void scopeData;

	return (
		<div className="dashboard-impact-container">
			<h2 className="dashboard-content-header">Impact</h2>
		</div>
	);
};

DashboardImpact.propTypes = propTypes;
export default DashboardImpact;
