import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { AnchorButton, Callout } from '@blueprintjs/core';

import { formatDate, datesAreSameCalendarDate } from 'shared/utils/dates';
import { getPubLatestReleasedDate } from 'shared/pub/pubDates';
import { pubUrl } from 'shared/utils/canonicalUrls';
import { usePageContext } from 'utils/hooks';

require('./pubHistoricalNotice.scss');

const propTypes = {};
const defaultProps = {};

const PubHistoricalNotice = (props) => {
	const { pubData } = props;
	const { communityData } = usePageContext();
	const { releases, currentReleaseIndex } = pubData;
	const currentReleaseDate = new Date(releases[currentReleaseIndex].createdAt);
	const latestReleaseDate = getPubLatestReleasedDate(pubData);
	const includeTime = datesAreSameCalendarDate(currentReleaseDate, latestReleaseDate);
	return (
		<Callout
			icon="history"
			intent="warning"
			className="pub-historical-notice-component"
			title="You're viewing an older release of this Pub."
		>
			<p>
				This version of the Pub was released{' '}
				{formatDate(currentReleaseDate, {
					includeTime: includeTime,
					includePreposition: true,
				})}
				. The latest version is from{' '}
				{formatDate(latestReleaseDate, {
					includeTime: includeTime,
					includePreposition: true,
				})}
				.
			</p>
			<AnchorButton href={pubUrl(communityData, pubData)}>
				View the latest release
			</AnchorButton>
		</Callout>
	);
};

PubHistoricalNotice.propTypes = propTypes;
PubHistoricalNotice.defaultProps = defaultProps;
export default PubHistoricalNotice;
