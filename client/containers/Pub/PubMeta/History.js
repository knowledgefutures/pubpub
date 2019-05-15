import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { useDebounce } from 'react-use';
import { Slider, Spinner } from '@blueprintjs/core';
import dateFormat from 'dateformat';

import { pubDataProps } from 'types/pub';
import { pubUrl } from 'shared/utils/canonicalUrls';
import ClickToCopyButton from 'components/ClickToCopyButton/ClickToCopyButton';
import { PageContext } from 'components/PageWrapper/PageWrapper';

require('./history.scss');

const propTypes = {
	historyData: PropTypes.shape({
		latestKey: PropTypes.number,
		timestamps: PropTypes.object,
	}).isRequired,
	pubData: pubDataProps.isRequired,
	updateLocalData: PropTypes.func.isRequired,
};

const History = (props) => {
	const {
		pubData,
		historyData: { timestamps, latestKey, currentKey },
		updateLocalData,
	} = props;

	const isLoading = latestKey === undefined;
	const nothingToShow = !isLoading && latestKey <= 1;

	const [value, setValue] = useState(currentKey);
	const { communityData } = useContext(PageContext);

	useEffect(() => {
		if (!value && currentKey) {
			setValue(currentKey);
		}
	}, [currentKey, value]);

	useDebounce(() => updateLocalData('history', { currentKey: value }), 100, [value]);

	const renderLabel = (step) => {
		const labelDateFormat = (date, withTime) =>
			dateFormat(date, 'mmm dd, yyyy' + (withTime ? ' HH:MM' : ''));
		const timestamp = timestamps[step];
		if (step === 1) {
			return labelDateFormat(pubData.createdAt);
		}
		if (step === latestKey) {
			return labelDateFormat(timestamp);
		}
		if (timestamp) {
			return labelDateFormat(timestamp);
		}
		return '...';
	};

	return (
		<div className="pub-meta_history-component">
			{isLoading && <Spinner size={25} />}
			{nothingToShow && 'This branch has no history (yet)'}
			{!isLoading && !nothingToShow && (
				<React.Fragment>
					<Slider
						min={1}
						max={latestKey}
						stepSize={1}
						labelRenderer={renderLabel}
						labelStepSize={latestKey - 1}
						value={value}
						onChange={setValue}
					/>
					<ClickToCopyButton
						className="click-to-copy"
						copyString={pubUrl(
							communityData,
							pubData,
							pubData.activeBranch.shortId,
							value && value.toString(),
						)}
						beforeCopyPrompt="Copy a link to this version"
					/>
				</React.Fragment>
			)}
		</div>
	);
};

History.propTypes = propTypes;
export default History;
