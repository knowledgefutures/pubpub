import React from 'react';
import { usePageContext } from 'utils/hooks';
import CommunityOverview from './CommunityOverview/CommunityOverview';
import CollectionOverview from './CollectionOverview/CollectionOverview';
import PubOverview from './PubOverview/PubOverview';

const DashboardOverview = (props) => {
	const { scopeData } = usePageContext();
	const { activeTargetType } = scopeData.elements;
	const overviewTypes = {
		community: CommunityOverview,
		collection: CollectionOverview,
		pub: PubOverview,
	};
	const ActiveComponent = overviewTypes[activeTargetType];
	return (
		<div className="dashboard-overview-container">
			<ActiveComponent {...props} />
		</div>
	);
};

export default DashboardOverview;
