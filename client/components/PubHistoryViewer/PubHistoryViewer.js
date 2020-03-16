import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useDebounce } from 'react-use';
import { Button, ButtonGroup, Card, Menu, MenuItem, Slider } from '@blueprintjs/core';

import { formatDate } from 'shared/utils/dates';
import { pubUrl } from 'shared/utils/canonicalUrls';
import { ClickToCopyButton } from 'components';
import { usePageContext } from 'utils/hooks';

require('./pubHistoryViewer.scss');

const propTypes = {
	historyData: PropTypes.shape({
		timestamps: PropTypes.object,
		currentKey: PropTypes.number,
		latestKey: PropTypes.number,
	}).isRequired,
	pubData: PropTypes.shape({
		createdAt: PropTypes.string.isRequired,
		releases: PropTypes.arrayOf(
			PropTypes.shape({
				createdAt: PropTypes.string.isRequired,
			}),
		).isRequired,
	}).isRequired,
	updateHistoryData: PropTypes.func.isRequired,
};
const defaultProps = {};

const dateTimestamps = (timestamps, minIntervalMs = 1000 * 60 * 30) => {
	const buckets = [];
	let currentBucket = [];
	let currentStartTimestamp = null;
	const keys = Object.keys(timestamps);
	for (let idx = 0; idx < keys.length; ++idx) {
		const historyKey = parseInt(keys[idx], 10);
		const timestamp = timestamps[historyKey];
		if (!currentStartTimestamp) {
			currentStartTimestamp = timestamp;
		}
		if (timestamp - currentStartTimestamp > minIntervalMs) {
			buckets.push(currentBucket);
			currentBucket = [[historyKey, timestamp]];
			currentStartTimestamp = timestamp;
		} else {
			currentBucket.push([historyKey, timestamp]);
		}
	}
	buckets.push(currentBucket);
	return buckets
		.filter((bucket) => bucket.length > 0)
		.map((bucket) => {
			const [startKey, startTimestamp] = bucket[0];
			const [endKey] = bucket[bucket.length - 1];
			const startDate = new Date(startTimestamp);
			return { type: 'edits', date: startDate, range: [startKey, endKey] };
		});
};

const dateReleases = (releases) => {
	return releases.map((release) => {
		return { type: 'release', date: new Date(release.createdAt), release: release };
	});
};

const bucketByDate = (entries) => {
	const dateEntries = {};
	entries.forEach((entry) => {
		const dateString = entry.date.toDateString();
		const entriesAtDate = dateEntries[dateString] || [];
		entriesAtDate.push(entry);
		dateEntries[dateString] = entriesAtDate;
	});
	return Object.entries(dateEntries);
};

const getDateForHistoryKey = (historyKey, timestamps) => {
	if (timestamps[historyKey]) {
		return new Date(timestamps[historyKey]);
	}
	// The keys are integers so Object.keys should return them in ascending order
	const keys = Object.keys(timestamps);
	const firstKeyIndexAfterStep = keys.findIndex((key) => key > historyKey);
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

const PubHistoryViewer = (props) => {
	const { historyData, pubData, updateHistoryData } = props;
	const { timestamps, latestKey, currentKey } = historyData;
	const { releases } = pubData;
	const { communityData } = usePageContext();
	const [sliderValue, setSliderValue] = useState(currentKey);
	const historyScrollRef = useRef(null);
	const hasScrolledRef = useRef(null);

	historyScrollRef.current = null;

	const currentDate = getDateForHistoryKey(currentKey, timestamps);
	const edits = dateTimestamps(timestamps);
	const datedReleases = dateReleases(releases);
	const entries = [
		{ type: 'created', date: new Date(pubData.createdAt) },
		...edits,
		...datedReleases,
	].sort((a, b) => (a.date > b.date ? 1 : -1));

	useEffect(() => {
		setSliderValue(currentKey);
	}, [currentKey]);

	useEffect(() => {
		if (historyScrollRef.current) {
			const { offsetParent, offsetTop } = historyScrollRef.current;
			if (offsetParent && !Number.isNaN(offsetTop)) {
				// Scroll to the current date minus some padding
				const scrollTarget = offsetTop - 7;
				if (typeof offsetParent.scrollTo === 'function' && hasScrolledRef.current) {
					offsetParent.scrollTo({ top: scrollTarget, behavior: 'smooth' });
				} else {
					offsetParent.scrollTop = scrollTarget;
				}
				hasScrolledRef.current = true;
			}
		}
	}, [currentKey]);

	useDebounce(() => updateHistoryData({ currentKey: sliderValue }), 100, [sliderValue]);

	const canChangeCurrentKeyBy = (step) => {
		const proposedKey = currentKey + step;
		return proposedKey >= 0 && proposedKey <= latestKey;
	};

	const changeCurrentKeyBy = (step) => {
		updateHistoryData({ currentKey: currentKey + step });
	};

	const renderSliderLabel = (historyKey) => {
		const dateForStep = getDateForHistoryKey(historyKey, timestamps);
		if (dateForStep) {
			const date = formatDate(dateForStep);
			const time = formatDate(dateForStep, { includeDate: false, includeTime: true });
			return (
				<span className="date-and-time">
					<span className="date">{date}</span> <span className="time">{time}</span>
				</span>
			);
		}
		return 'loading date...';
	};

	const renderMenuItemForEntry = (entry) => {
		const { date } = entry;
		const key = entry.type + '__' + formatDate(date, { includeTime: true });
		if (entry.type === 'edits') {
			const {
				range: [startKey, endKey],
			} = entry;
			const containsCurrentKey = currentKey >= startKey && currentKey <= endKey;
			const dateString = formatDate(date, { includeTime: true, includeDate: false });
			return (
				<MenuItem
					text={dateString}
					icon={containsCurrentKey ? 'chevron-right' : 'flag'}
					key={key}
					onClick={() => updateHistoryData({ currentKey: startKey })}
					active={containsCurrentKey}
					intent={containsCurrentKey ? 'primary' : 'none'}
				/>
			);
		}
		if (entry.type === 'release') {
			const { release } = entry;
			const dateString = formatDate(date, {
				includeTime: true,
				includeDate: false,
				includePreposition: true,
			});
			return (
				<MenuItem
					text={`Release ${dateString}`}
					intent="success"
					icon="document-open"
					key={key}
					href={pubUrl(communityData, pubData, { releaseNumber: release.branchKey })}
					target="_blank"
				/>
			);
		}
		if (entry.type === 'created') {
			const dateString = formatDate(date, {
				includeTime: true,
				includeDate: false,
				includePreposition: true,
			});
			return <MenuItem text={`Created ${dateString}`} disabled={true} icon="clean" />;
		}
		return null;
	};

	const renderDateEntries = (dateString, dateEntries) => {
		const maybeScrollRef =
			currentDate && dateString === currentDate.toDateString() ? historyScrollRef : null;
		const header = (
			<h6 ref={maybeScrollRef}>
				<li className="bp3-menu-header">{dateString}</li>
			</h6>
		);
		const menuItems = dateEntries.map(renderMenuItemForEntry);
		return (
			<>
				{header}
				{menuItems}
			</>
		);
	};

	return (
		<Card className="pub-history-viewer-component" elevation={2}>
			<ButtonGroup className="playback-button-group">
				<Button
					icon="double-chevron-left"
					disabled={!canChangeCurrentKeyBy(-50)}
					onClick={() => changeCurrentKeyBy(-50)}
				/>
				<Button
					icon="chevron-left"
					disabled={!canChangeCurrentKeyBy(-1)}
					onClick={() => changeCurrentKeyBy(-1)}
				/>
				<ClickToCopyButton
					copyString={pubUrl(communityData, pubData, {
						isDraft: true,
						historyKey: currentKey.toString(),
					})}
					beforeCopyPrompt="Copy link to this point in history"
				>
					{(handleClick) => (
						<Button icon="link" onClick={handleClick}>
							Link here
						</Button>
					)}
				</ClickToCopyButton>
				<Button
					icon="chevron-right"
					disabled={!canChangeCurrentKeyBy(1)}
					onClick={() => changeCurrentKeyBy(1)}
				/>
				<Button
					icon="double-chevron-right"
					disabled={!canChangeCurrentKeyBy(50)}
					onClick={() => changeCurrentKeyBy(50)}
				/>
			</ButtonGroup>
			<Slider
				min={0}
				max={latestKey}
				stepSize={1}
				labelRenderer={renderSliderLabel}
				labelStepSize={latestKey}
				value={sliderValue}
				onChange={setSliderValue}
			/>
			<Menu>
				{bucketByDate(entries).map(([dateString, dateEntries]) =>
					renderDateEntries(dateString, dateEntries),
				)}
			</Menu>
		</Card>
	);
};

PubHistoryViewer.propTypes = propTypes;
PubHistoryViewer.defaultProps = defaultProps;
export default PubHistoryViewer;
