import React from 'react';
import { usePageContext } from 'utils/hooks';
import CommunityOverview from './CommunityOverview/CommunityOverview';
import CollectionOverview from './CollectionOverview/CollectionOverview';
import PubOverview from './PubOverview/PubOverview';

const DashboardOverview = (props) => {
	const { scopeData } = usePageContext();
	const { activeTargetType } = scopeData.elements;
	const overviewTypes = {
		community: <CommunityOverview {...props} />,
		collection: <CollectionOverview {...props} />,
		pub: <PubOverview {...props} />,
	};
	return <div className="dashboard-overview-container">{overviewTypes[activeTargetType]}</div>;
};

export default DashboardOverview;
