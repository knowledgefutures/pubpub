import React from 'react';
import PropTypes from 'prop-types';
import { usePageContext } from 'utils/hooks';
import ContentOverview from './ContentOverview';
import PubOverview from './PubOverview';

const propTypes = {
	overviewData: PropTypes.object.isRequired,
};

const DashboardOverview = (props) => {
	const { overviewData } = props;
	const { scopeData } = usePageContext();
	const { activeTargetType } = scopeData.elements;
	const isContentList = activeTargetType === 'community' || activeTargetType === 'collection';
	const isPub = activeTargetType === 'pub';

	return (
		<div className="dashboard-overview-container">
			{isContentList && <ContentOverview overviewData={overviewData} />}
			{isPub && <PubOverview overviewData={overviewData} />}
		</div>
	);
};

DashboardOverview.propTypes = propTypes;
export default DashboardOverview;
