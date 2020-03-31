import React from 'react';
import PropTypes from 'prop-types';
import dateFormat from 'dateformat';
import TimeAgo from 'react-timeago';

import { usePageContext } from 'utils/hooks';
import PubHeaderBackground from 'containers/Pub/PubHeader/PubHeaderBackground';
import { DashboardFrame, SettingsSection } from 'components';
import { getAllPubContributors } from 'utils/pubContributors';

require('./pubOverview.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
};

const PubOverview = (props) => {
	const { pubData } = props;
	const { communityData } = usePageContext();
	const contributorsCount = getAllPubContributors(pubData).length;

	const renderUpdatedTime = () => {
		// activeBranch is taken to be #draft since that's what we enrich the pub with server-side
		const { latestKeyAt: latestKeyAtSring } = pubData.activeBranch;
		const latestKeyAt = new Date(latestKeyAtSring);
		if (new Date().toDateString() === latestKeyAt.toDateString()) {
			return <TimeAgo date={latestKeyAt} minPeriod={60} />;
		}
		return dateFormat(latestKeyAtSring, 'mmm dd, yyyy');
	};

	const renderBlock = (title, text) => {
		return (
			<div className="block">
				<div className="block-title">{title}</div>
				<div className="block-text">{text}</div>
			</div>
		);
	};

	return (
		<DashboardFrame className="pub-overview-component" title="Overview">
			<PubHeaderBackground
				className="pub-header-component"
				pubData={pubData}
				communityData={communityData}
				showSafetyLayer={true}
			>
				<div className="header-content">
					<h1 className="title">{pubData.title}</h1>
					<div className="edit">Edit Title</div>
					<div className="description">{pubData.description}</div>
					<div className="edit">Edit Description</div>
				</div>
			</PubHeaderBackground>
			<div className="edit">Edit Theme</div>
			<div className="blocks">
				{renderBlock('Created', dateFormat(pubData.createdAt, 'mmm dd, yyyy'))}
				{renderBlock('Updated', renderUpdatedTime())}
				{renderBlock('Published', renderUpdatedTime())}
				{renderBlock('DOI', renderUpdatedTime())}
			</div>
			<div className="blocks">
				{renderBlock('Appears in Collections', renderUpdatedTime())}
				{renderBlock('Cite As', dateFormat(pubData.createdAt, 'mmm dd, yyyy'))}
			</div>
			<div className="list">
				<div className="list-title">Reviews</div>
				<div className="list-content">Stuff</div>
			</div>
			<div className="list">
				<div className="list-title">Releases</div>
				<div className="list-content">Stuff</div>
			</div>
		</DashboardFrame>
	);
};

PubOverview.propTypes = propTypes;
export default PubOverview;
