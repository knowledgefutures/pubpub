import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useDebounce } from 'react-use';
import { Slider, Spinner } from '@blueprintjs/core';
import dateFormat from 'dateformat';
import stickybits from 'stickybits';

import { pubDataProps } from 'types/pub';
import { pubUrl } from 'shared/utils/canonicalUrls';
import { GridWrapper } from 'components';
import { usePageContext } from 'utils/hooks';
import ClickToCopyButton from 'components/ClickToCopyButton/ClickToCopyButton';

require('./pubHistory.scss');

const propTypes = {
	historyData: PropTypes.shape({
		latestKey: PropTypes.number,
		timestamps: PropTypes.object,
		currentKey: PropTypes.number,
	}).isRequired,
	pubData: pubDataProps.isRequired,
	updateLocalData: PropTypes.func.isRequired,
};

const labelDateFormat = (date, withTime) =>
	dateFormat(date, 'mmm dd, yyyy' + (withTime ? ' HH:MM' : ''));

const interpolateLabelDateForStep = (step, timestamps) => {
	// The keys are integers so Object.keys should return them in ascending order
	const keys = Object.keys(timestamps);
	const firstKeyIndexAfterStep = keys.findIndex((key) => key > step);
	if (firstKeyIndexAfterStep > 0) {
		const firstKeyAfterStep = keys[firstKeyIndexAfterStep];
		const lastKeyBeforeStep = keys[firstKeyIndexAfterStep - 1];
		const firstDateAfterStep = new Date(timestamps[firstKeyAfterStep]);
		const lastDateBeforeStep = new Date(timestamps[lastKeyBeforeStep]);
		if (lastDateBeforeStep.toDateString() === firstDateAfterStep.toDateString()) {
			return firstDateAfterStep;
		}
	}
	return null;
};

const PubHistory = (props) => {
	const {
		pubData,
		historyData: { timestamps, latestKey, currentKey },
		updateLocalData,
	} = props;

	const isLoading = latestKey === undefined;
	const nothingToShow = !isLoading && latestKey <= 0;

	const stickyRef = useRef();
	const [value, setValue] = useState(currentKey);
	const { communityData } = usePageContext();

	useEffect(() => {
		stickyRef.current = stickybits('.pub-history-component', {
			stickyBitStickyOffset: 37,
			useStickyClasses: true,
		});
		return () => {
			if (stickyRef.current) {
				try {
					stickyRef.current.cleanup();
				} catch (_) {
					// This sometimes fails if the element's parent has been unmounted. That's okay.
				}
			}
		};
	}, []);

p
	const renderLabel = (step) => {
		if (step === 0) {
			return labelDateFormat(pubData.createdAt, true);
		}
		if (timestamps[step]) {
			return labelDateFormat(timestamps[step], true);
		}
		const interpolatedDate = interpolateLabelDateForStep(step, timestamps);
		if (interpolatedDate) {
			return labelDateFormat(interpolatedDate, false);
		}
		return '...';
	};

	return (
		<div className="pub-history-component">
			<GridWrapper containerClassName="pub">
				<div className="pub-history-inner">
					{isLoading && <Spinner size={25} />}
					{nothingToShow && 'This branch has no past versions.'}
					{!isLoading && !nothingToShow && (
						<React.Fragment>
							<Slider
								min={0}
								max={latestKey}
								stepSize={1}
								labelRenderer={renderLabel}
								labelStepSize={latestKey}
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
			</GridWrapper>
		</div>
	);
};

PubHistory.propTypes = propTypes;
export default PubHistory;
