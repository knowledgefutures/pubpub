import React from 'react';
import PropTypes from 'prop-types';
import { hydrateWrapper } from 'utils';
import { AccentStyle, Header } from 'components';
import SideMenu from './SideMenu';
import Breadcrumbs from './Breadcrumbs';
import ContentOverview from './ContentOverview';
import PubOverview from './PubOverview';
import Conversations from './Conversations';

require('./dash.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	loginData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
	// pubData: PropTypes.array.isRequired,
};

const Dash = (props) => {
	const { communityData, locationData, loginData } = props;

	// const collectionSlug = locationData.params.collectionSlug || locationData.query.collectionSlug;
	const pubSlug = locationData.params.pubSlug;
	const activeMode = locationData.params.mode || 'overview';
	const activeSubmode = locationData.params.submode;

	return (
		<div className="container-dash">
			<AccentStyle communityData={communityData} isNavHidden={true} />
			<Header
				communityData={communityData}
				locationData={locationData}
				loginData={loginData}
			/>
			<div className="side-content">
				<SideMenu communityData={communityData} locationData={locationData} />
			</div>
			<div className="body-block">
				<div className="body-content">
					<Breadcrumbs communityData={communityData} locationData={locationData} />
					{activeMode === 'overview' && !pubSlug && (
						<ContentOverview
							communityData={communityData}
							locationData={locationData}
							loginData={loginData}
						/>
					)}
					{activeMode === 'overview' && pubSlug && (
						<PubOverview
							communityData={communityData}
							locationData={locationData}
							loginData={loginData}
						/>
					)}
					{activeMode === 'conversations' && activeSubmode === 'list' && (
						<Conversations
							communityData={communityData}
							locationData={locationData}
							loginData={loginData}
						/>
					)}
				</div>
			</div>
		</div>
	);
};

Dash.propTypes = propTypes;
export default Dash;

hydrateWrapper(Dash);
