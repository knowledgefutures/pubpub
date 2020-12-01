import React, { useState, useEffect, useRef } from 'react';
import classNames from 'classnames';
import { Button, ButtonGroup, Menu, MenuItem, Slider, Spinner } from '@blueprintjs/core';

import { ClickToCopyButton } from 'components';
import { usePageContext } from 'utils/hooks';
import { useSticky } from 'client/utils/useSticky';
import { formatDate } from 'utils/dates';
import { pubUrl } from 'utils/canonicalUrls';

require('./pubHistoryViewer.scss');

type OwnProps = {
	historyData: {
		timestamps?: any;
		currentKey?: number;
		latestKey?: number;
		outstandingRequests?: number;
		loadedIntoHistory?: boolean;
	};
	onClose: (...args: any[]) => any;
	pubData: {
		createdAt: string;
		releases: {
			createdAt: string;
		}[];
	};
	updateHistoryData: (...args: any[]) => any;
};
const defaultProps = {};

const bucketTimestamp = (timestamp, intervalMs) => {
	return Math.floor(timestamp / intervalMs);
};

const dateTimestamps = (timestamps, intervalMs = 1000 * 60 * 15) => {
	const buckets = [];
	let currentBucketItems = [];
	let currentBucketValue = null;
	const keys = Object.keys(timestamps)
		.map((key) => parseInt(key, 10))
		.sort((a, b) => a - b);
	for (let idx = 0; idx < keys.length; ++idx) {
		const historyKey = keys[idx];
		const timestamp = timestamps[historyKey];
		const bucketValue = bucketTimestamp(timestamp, intervalMs);
		if (!currentBucketValue) {
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'number' is not assignable to type 'null'.
			currentBucketValue = bucketValue;
		}
		if (bucketValue !== currentBucketValue) {
			// @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'never[]' is not assignable to pa... Remove this comment to see the full error message
			buckets.push(currentBucketItems);
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'number' is not assignable to type 'never'.
			currentBucketItems = [[historyKey, timestamp]];
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'number' is not assignable to type 'null'.
			currentBucketValue = bucketValue;
		} else {
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'number' is not assignable to type 'never'.
			currentBucketItems.push([historyKey, timestamp]);
		}
	}
	// @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'never[]' is not assignable to pa... Remove this comment to see the full error message
	buckets.push(currentBucketItems);
	return (
		buckets
			// @ts-expect-error ts-migrate(2339) FIXME: Property 'length' does not exist on type 'never'.
			.filter((bucket) => bucket.length > 0)
			.map((bucket) => {
				const [startKey, startTimestamp] = bucket[0];
				// @ts-expect-error ts-migrate(2339) FIXME: Property 'length' does not exist on type 'never'.
				const [endKey] = bucket[bucket.length - 1];
				const startDate = new Date(startTimestamp);
				return { type: 'edits', date: startDate, range: [startKey, endKey] };
			})
	);
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

type Props = OwnProps & typeof defaultProps;

const PubHistoryViewer = (props: Props) => {
	const { historyData, pubData, updateHistoryData, onClose } = props;
	const {
		timestamps,
		latestKey,
		currentKey,
		outstandingRequests,
		loadedIntoHistory,
	} = historyData;
	const { releases } = pubData;
	const { communityData } = usePageContext();
	const [sliderValue, setSliderValue] = useState(currentKey);
	const historyScrollRef = useRef(null);
	const hasScrolledRef = useRef(null);
	// @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
	const isLoadingHistory = outstandingRequests > 0;
	// @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
	const hasMeaningfulHistory = latestKey >= 0;

	historyScrollRef.current = null;

	const currentDate = getDateForHistoryKey(currentKey, timestamps);
	const edits = dateTimestamps(timestamps);
	const datedReleases = dateReleases(releases);
	const entries = [
		{ type: 'created', date: new Date(pubData.createdAt) },
		...edits,
		...datedReleases,
	].sort((a, b) => (a.date > b.date ? 1 : -1));

	useSticky({
		selector: '.pub-history-viewer-component',
		offset: 37 + 25,
	});

	useEffect(() => {
		// @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
		setSliderValue(currentKey + 1);
	}, [currentKey]);

	useEffect(() => {
		if (historyScrollRef.current) {
			// @ts-expect-error ts-migrate(2339) FIXME: Property 'offsetParent' does not exist on type 'nu... Remove this comment to see the full error message
			const { offsetParent, offsetTop } = historyScrollRef.current;
			if (offsetParent && !Number.isNaN(offsetTop)) {
				// Scroll to the current date minus some padding
				const scrollTarget = offsetTop - 7;
				if (typeof offsetParent.scrollTo === 'function' && hasScrolledRef.current) {
					offsetParent.scrollTo({ top: scrollTarget, behavior: 'smooth' });
				} else {
					offsetParent.scrollTop = scrollTarget;
				}
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'true' is not assignable to type 'null'.
				hasScrolledRef.current = true;
			}
		}
	}, [currentKey]);

	const canChangeCurrentKeyBy = (step) => {
		const proposedKey = currentKey + step;
		// @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
		return proposedKey >= 0 && proposedKey <= latestKey;
	};

	const changeCurrentKeyBy = (step) => {
		updateHistoryData({ currentKey: currentKey + step });
	};

	const renderSliderLabel = (sliderVal) => {
		const historyKey = sliderVal - 1;
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
		return isLoadingHistory ? 'Loading...' : 'Release slider to load';
	};

	const renderMenuItemForEntry = (entry) => {
		const { date } = entry;
		const key = entry.type + '_' + date.valueOf().toString();
		if (entry.type === 'edits') {
			const {
				range: [startKey, endKey],
			} = entry;
			// @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
			const containsCurrentKey = currentKey >= startKey && currentKey <= endKey;
			const dateString = formatDate(date, { includeTime: true, includeDate: false });
			return (
				<MenuItem
					icon="blank"
					text={dateString}
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
					icon="document-share"
					key={key}
					href={pubUrl(communityData, pubData, { releaseNumber: release.branchKey + 1 })}
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
			return (
				<MenuItem
					key="created"
					text={`Created ${dateString}`}
					disabled={true}
					icon="clean"
				/>
			);
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
			<div key={dateString}>
				{header}
				{menuItems}
			</div>
		);
	};

	return (
		<div className={classNames('pub-history-viewer-component', isLoadingHistory && 'loading')}>
			<div className="top-line">
				<div className="title-and-spinner">
					<h4>Pub History</h4>
					<Spinner size={16} />
				</div>
				{!loadedIntoHistory && (
					<Button minimal small icon="cross" onClick={onClose} className="close-button" />
				)}
			</div>
			{hasMeaningfulHistory && (
				<ButtonGroup className="playback-button-group">
					<Button
						minimal
						icon="double-chevron-left"
						disabled={!canChangeCurrentKeyBy(-50)}
						onClick={() => changeCurrentKeyBy(-50)}
					/>
					<Button
						minimal
						icon="chevron-left"
						disabled={!canChangeCurrentKeyBy(-1)}
						onClick={() => changeCurrentKeyBy(-1)}
					/>
					{/* @ts-expect-error ts-migrate(2745) FIXME: This JSX tag's 'children' prop expects type 'never... Remove this comment to see the full error message */}
					<ClickToCopyButton
						// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
						copyString={pubUrl(communityData, pubData, {
							isDraft: true,
							// @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
							historyKey: currentKey.toString(),
						})}
						// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
						beforeCopyPrompt="Copy link to this point in history"
					>
						{(handleClick) => (
							<Button minimal icon="link" onClick={handleClick}>
								Link here
							</Button>
						)}
					</ClickToCopyButton>
					<Button
						minimal
						icon="chevron-right"
						disabled={!canChangeCurrentKeyBy(1)}
						onClick={() => changeCurrentKeyBy(1)}
					/>
					<Button
						minimal
						icon="double-chevron-right"
						disabled={!canChangeCurrentKeyBy(50)}
						onClick={() => changeCurrentKeyBy(50)}
					/>
				</ButtonGroup>
			)}
			{hasMeaningfulHistory && (
				<Slider
					min={0}
					// @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
					max={latestKey + 1}
					stepSize={1}
					labelRenderer={renderSliderLabel}
					// @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
					labelStepSize={latestKey + 1}
					value={sliderValue}
					onChange={setSliderValue}
					onRelease={(value) => updateHistoryData({ currentKey: value - 1 })}
				/>
			)}
			<Menu>
				{bucketByDate(entries).map(([dateString, dateEntries]) =>
					renderDateEntries(dateString, dateEntries),
				)}
			</Menu>
		</div>
	);
};
PubHistoryViewer.defaultProps = defaultProps;
export default PubHistoryViewer;
