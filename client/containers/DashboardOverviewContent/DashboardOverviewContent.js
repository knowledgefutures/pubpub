import React from 'react';
import PropTypes from 'prop-types';
import { hydrateWrapper } from 'utils';
import { PageWrapper } from 'components';
import ContentOverview from './ContentOverview';

// require('./dash.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	loginData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
	// pubData: PropTypes.array.isRequired,
};

const DashboardOverviewContent = (props) => {
	const { communityData, locationData, loginData } = props;

	return (
		<div className="dashboard-overview-content-container">
			<PageWrapper
				loginData={loginData}
				communityData={communityData}
				locationData={locationData}
				isDashboard={true}
			>
				<ContentOverview
					communityData={communityData}
					locationData={locationData}
					loginData={loginData}
				/>
			</PageWrapper>
		</div>
	);
};

DashboardOverviewContent.propTypes = propTypes;
export default DashboardOverviewContent;

hydrateWrapper(DashboardOverviewContent);
