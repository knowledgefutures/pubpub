import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { PageWrapper, GridWrapper, SkipLink } from 'components';
import { hydrateWrapper } from 'utils';
import DashboardSide from './DashboardSide';
import DashboardContent from './DashboardContent';

require('./dashboard.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	loginData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
	pageData: PropTypes.object.isRequired,
	pubsData: PropTypes.array.isRequired,
};

const Dashboard = (props) => {
	const [communityData, setCommunityData] = useState(props.communityData);
	const [pageData, setPageData] = useState(props.pageData);
	const activeSlug = props.locationData.params.slug || '';
	const activeMode = props.locationData.params.mode || '';
	const useNoScrollClass = activeMode === 'collections' && activeSlug;
	return (
		<div id="dashboard-container" className={useNoScrollClass ? 'no-scroll' : ''}>
			<PageWrapper
				loginData={props.loginData}
				communityData={communityData}
				locationData={props.locationData}
				hideNav={true}
				hideFooter={true}
			>
				<GridWrapper columnClassName="dashboard-columns">
					<div className="side-content">
						<SkipLink targetId="dashboard-content">Skip to dashboard content</SkipLink>
						<DashboardSide
							pages={communityData.pages}
							activeSlug={activeSlug}
							activeMode={activeMode}
						/>
					</div>

					<div id="dashboard-content" tabIndex="-1" className="main-content">
						<DashboardContent
							mode={activeMode}
							slug={activeSlug}
							pageData={pageData}
							communityData={communityData}
							setCommunityData={setCommunityData}
							setPageData={setPageData}
							pubsData={props.pubsData}
							locationData={props.locationData}
						/>
					</div>
				</GridWrapper>
			</PageWrapper>
		</div>
	);
};

Dashboard.propTypes = propTypes;
export default Dashboard;

hydrateWrapper(Dashboard);
