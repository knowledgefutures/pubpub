import React from 'react';
import PropTypes from 'prop-types';
import { usePageContext } from 'utils/hooks';

require('./dashboardSite.scss');

const propTypes = {
	siteData: PropTypes.object.isRequired,
};

const DashboardSite = (props) => {
	const { siteData } = props;
	const { scopeData } = usePageContext();

	return (
		<div className="dashboard-site-container">
			<h2 className="dashboard-content-header">Site</h2>
		</div>
	);
};

DashboardSite.propTypes = propTypes;
export default DashboardSite;
