import React, { useState, useEffect, useContext, useRef } from 'react';
import PropTypes from 'prop-types';
import { useDebounce } from 'react-use';
import { Slider, Spinner } from '@blueprintjs/core';
import dateFormat from 'dateformat';
import stickybits from 'stickybits';

import { pubDataProps } from 'types/pub';
import { pubUrl } from 'shared/utils/canonicalUrls';
import { GridWrapper } from 'components';
import { PageContext } from 'utils/hooks';
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

const History = (props) => {
	const {
		pubData,
		historyData: { timestamps, latestKey, currentKey },
		updateLocalData,
	} = props;

	const isLoading = latestKey === undefined;
	const nothingToShow = !isLoading && latestKey <= 0;

	const stickyRef = useRef();
	const [value, setValue] = useState(currentKey);
	const { communityData } = useContext(PageContext);

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

	useEffect(() => {
		if (value === undefined && currentKey) {
			setValue(currentKey);
		}
	}, [currentKey, value]);

	useDebounce(() => updateLocalData('history', { currentKey: value }), 100, [value]);

	const renderLabel = (step) => {
		const labelDateFormat = (date, withTime) =>
			dateFormat(date, 'mmm dd, yyyy' + (withTime ? ' HH:MM' : ''));
		const timestamp = timestamps[step];
		if (step === 0) {
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

History.propTypes = propTypes;
export default History;
