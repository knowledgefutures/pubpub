import React from 'react';
import PropTypes from 'prop-types';
import { usePageContext } from 'utils/hooks';

require('./dashboardReviews.scss');

const propTypes = {
	reviewsData: PropTypes.object.isRequired,
};

const DashboardReviews = (props) => {
	const { reviewsData } = props;
	const { scopeData } = usePageContext();

	return (
		<div className="dashboard-reviews-container">
			<h2 className="dashboard-content-header">Reviews</h2>
		</div>
	);
};

DashboardReviews.propTypes = propTypes;
export default DashboardReviews;
