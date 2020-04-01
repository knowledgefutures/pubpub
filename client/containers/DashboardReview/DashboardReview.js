import React from 'react';
import PropTypes from 'prop-types';
import { Menu, MenuItem, NonIdealState, Tag } from '@blueprintjs/core';
import dateFormat from 'dateformat';
import { DashboardFrame } from 'components';
import { usePageContext } from 'utils/hooks';

require('./dashboardReview.scss');

const propTypes = {
	reviewData: PropTypes.object.isRequired,
};

const DashboardReview = (props) => {
	const { reviewData } = props;
	// const { scopeData } = usePageContext();
	return (
		<DashboardFrame
			className="dashboard-review-container"
			title={`Reviews: ${reviewData.number}`}
		>
			Hello
		</DashboardFrame>
	);
};

DashboardReview.propTypes = propTypes;
export default DashboardReview;
