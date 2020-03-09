import React from 'react';
import { usePageContext } from 'utils/hooks';
import ContentOverview from './ContentOverview';
import PubOverview from './PubOverview';

const DashboardOverview = (props) => {
	const { scopeData } = usePageContext();
	const { activeTargetType } = scopeData.elements;
	const isContentList = activeTargetType === 'community' || activeTargetType === 'collection';
	const isPub = activeTargetType === 'pub';

	return (
		<div className="dashboard-overview-container">
			{isContentList && <ContentOverview {...props} />}
			{isPub && <PubOverview {...props} />}
		</div>
	);
};

export default DashboardOverview;
