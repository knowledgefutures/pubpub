import React from 'react';
import PropTypes from 'prop-types';
import Team from './Team';
import Settings from './Settings';
import CreatePage from './CreatePage';
import Pubs from './Pubs';
import Page from './Page';
import Collections from './Collections';
import Collection from './Collection';

const propTypes = {
	mode: PropTypes.string.isRequired,
	slug: PropTypes.string.isRequired,
	pageData: PropTypes.object.isRequired,
	communityData: PropTypes.object.isRequired,
	setCommunityData: PropTypes.func.isRequired,
	setPageData: PropTypes.func.isRequired,
	pubsData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
};

const DashboardContent = (props) => {
	const activeCollection = props.communityData.collections.find((collection) => {
		return collection.id === props.slug;
	});

	switch (props.mode) {
		case 'pubs':
			return <Pubs communityData={props.communityData} pubsData={props.pubsData} />;
		case 'team':
			return (
				<Team
					communityData={props.communityData}
					setCommunityData={props.setCommunityData}
				/>
			);
		case 'settings':
			return (
				<Settings
					communityData={props.communityData}
					setCommunityData={props.setCommunityData}
				/>
			);
		case 'collections':
			return activeCollection ? (
				<Collection
					communityData={props.communityData}
					initialCollection={activeCollection}
					pubsData={props.pubsData}
					collectionId={props.slug}
				/>
			) : (
				<Collections
					communityData={props.communityData}
					setCommunityData={props.setCommunityData}
				/>
			);
		case 'page':
			return (
				<CreatePage
					communityData={props.communityData}
					hostname={props.locationData.hostname}
				/>
			);
		default:
			return (
				<Page
					communityData={props.communityData}
					locationData={props.locationData}
					pageData={props.pageData}
					setCommunityData={props.setCommunityData}
					setPageData={props.setPageData}
				/>
			);
	}
};

DashboardContent.propTypes = propTypes;
export default DashboardContent;
