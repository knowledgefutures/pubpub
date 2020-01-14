import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { GridWrapper, SkipLink } from 'components';
import { usePageContext } from 'utils/hooks';
import DashboardSide from './DashboardSide';
import DashboardContent from './DashboardContent';

require('./dashboard.scss');

const propTypes = {
	pageData: PropTypes.object.isRequired,
	pubsData: PropTypes.array.isRequired,
};

const Dashboard = (props) => {
	const { locationData, communityData: initCommunityData } = usePageContext();
	const [communityData, setCommunityData] = useState(initCommunityData);
	const [pageData, setPageData] = useState(props.pageData);
	const activeSlug = locationData.params.slug || '';
	const activeMode = locationData.params.mode || '';
	const useNoScrollClass = activeMode === 'collections' && activeSlug;
	return (
		<div id="dashboard-container" className={useNoScrollClass ? 'no-scroll' : ''}>
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
						locationData={locationData}
					/>
				</div>
			</GridWrapper>
		</div>
	);
};

Dashboard.propTypes = propTypes;
export default Dashboard;
