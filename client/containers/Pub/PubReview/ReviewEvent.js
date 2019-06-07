import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import TimeAgo from 'react-timeago';
import { ButtonGroup, Button, Intent, Tag, Tabs, Tab } from '@blueprintjs/core';
import { pubDataProps } from 'types/pub';
import { GridWrapper, Icon, InputField } from 'components';
import { PageContext } from 'components/PageWrapper/PageWrapper';
import { apiFetch } from 'utils';

const propTypes = {
	pubData: pubDataProps.isRequired,
	eventData: PropTypes.object.isRequired,
	updateLocalData: PropTypes.func.isRequired,
};

const ReviewEvent = (props) => {
	const { pubData, eventData, updateLocalData } = props;
	const { communityData, locationData } = useContext(PageContext);

	return (
		<div className="review-event-component">
			{JSON.stringify(eventData)}
			<TimeAgo
				minPeriod={60}
				formatter={(value, unit, suffix) => {
					if (unit === 'second') {
						return 'just now';
					}
					let newUnit = unit;
					if (value > 1) {
						newUnit += 's';
					}
					return ` ${value} ${newUnit} ${suffix}`;
				}}
				date={eventData.createdAt}
			/>
		</div>
	);
};

ReviewEvent.propTypes = propTypes;
export default ReviewEvent;
