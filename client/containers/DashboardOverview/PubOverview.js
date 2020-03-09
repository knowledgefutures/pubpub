import React from 'react';
import PropTypes from 'prop-types';
import dateFormat from 'dateformat';
import TimeAgo from 'react-timeago';
import { Button } from 'reakit';

import { Byline, DashboardFrame, SettingsSection } from 'components';
import { usePageContext } from 'utils/hooks';
import { getAllPubContributors } from 'utils/pubContributors';

require('./contentOverview.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
};

const PubOverview = (props) => {
	const { pubData } = props;
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

	const renderContributors = () => {
		return (
			<Byline
				pubData={pubData}
				showTheWordBy={false}
				emptyState={<i>This Pub has no listed contributors yet.</i>}
			/>
		);
	};

	return (
		<DashboardFrame className="pub-overview-component" title="Overview">
			<SettingsSection title="Pub Title">{pubData.title}</SettingsSection>
			<SettingsSection title="Created">
				{dateFormat(pubData.createdAt, 'mmm dd, yyyy')}
			</SettingsSection>
			<SettingsSection title="Updated">{renderUpdatedTime()}</SettingsSection>
			<SettingsSection title={`Contributors (${contributorsCount})`}>
				{renderContributors()}
			</SettingsSection>
		</DashboardFrame>
	);
};

PubOverview.propTypes = propTypes;
export default PubOverview;
