import React from 'react';
import PropTypes from 'prop-types';
import { usePageContext } from 'utils/hooks';

require('./dashboardDiscussions.scss');

const propTypes = {
	discussionsData: PropTypes.object.isRequired,
};

const DashboardDiscussions = (props) => {
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

DashboardDiscussions.propTypes = propTypes;
export default DashboardDiscussions;
