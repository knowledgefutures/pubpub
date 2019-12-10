import React from 'react';
import PropTypes from 'prop-types';
import { hydrateWrapper } from 'utils';
import { PageWrapper } from 'components';
import ContentOverview from './ContentOverview';
import PubOverview from './PubOverview';

const propTypes = {
	communityData: PropTypes.object.isRequired,
	loginData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
	scopeData: PropTypes.object.isRequired,
	overviewData: PropTypes.object.isRequired,
};

const DashboardOverview = (props) => {
	const { communityData, locationData, loginData, scopeData, overviewData } = props;
	const { activeTargetType } = scopeData;
	const isContentList = activeTargetType === 'community' || activeTargetType === 'collection';
	const isPub = activeTargetType === 'pub';

	return (
		<div className="dashboard-overview-container">
			<PageWrapper
				loginData={loginData}
				communityData={communityData}
				locationData={locationData}
				scopeData={scopeData}
				isDashboard={true}
			>
				{isContentList && <ContentOverview overviewData={overviewData} />}
				{isPub && <PubOverview overviewData={overviewData} />}
			</PageWrapper>
		</div>
	);
};

DashboardOverview.propTypes = propTypes;
export default DashboardOverview;

hydrateWrapper(DashboardOverview);
