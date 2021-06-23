import dateFormat from 'dateformat';

import { RenderedActivityItem } from 'client/utils/activity/types';

type Boundary = {
	definition: number;
	label: string;
};

export type BoundaryGroup = {
	label: string;
	key: number;
	items: RenderedActivityItem[];
};

const getMidnightLocalTimestamp = (dateSource: Date) => {
	const date = new Date(dateSource);
	date.setHours(23, 59, 59, 999);
	return date.valueOf();
};

const getTodayBoundary = (today: Date): Boundary => {
	return {
		definition: getMidnightLocalTimestamp(today),
		label: 'Today',
	};
};

const getDaysAgoBoundary = (daysAgo: number, today: Date): Boundary => {
	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - daysAgo);
	const label = daysAgo === 1 ? 'Yesterday' : 'This week';
	return {
		definition: getMidnightLocalTimestamp(yesterday),
		label,
	};
};

const getWeeksAgoBoundary = (weeksAgo: number, today: Date): Boundary => {
	const lastSunday = new Date(today);
	lastSunday.setDate(lastSunday.getDate() - lastSunday.getDay());
	const sundayWeeksAgo = new Date(lastSunday);
	sundayWeeksAgo.setDate(sundayWeeksAgo.getDate() - 7 * (weeksAgo - 1));
	const label = weeksAgo === 1 ? 'Last week' : `${weeksAgo} weeks ago`;
	return {
		definition: getMidnightLocalTimestamp(sundayWeeksAgo),
		label,
	};
};

const getMonthsAgoBoundary = (monthsAgo: number, today: Date): Boundary => {
	const lastDayOfThisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
	const lastDayOfMonthsAgo = new Date(lastDayOfThisMonth);
	lastDayOfMonthsAgo.setMonth(lastDayOfMonthsAgo.getMonth() - monthsAgo);
	const label = dateFormat(lastDayOfMonthsAgo, 'mmmm yyyy');
	return {
		definition: getMidnightLocalTimestamp(lastDayOfMonthsAgo),
		label,
	};
};

const createBoundaries = (today: Date, earliestDate: Date) => {
	const earliestDateValue = earliestDate.valueOf();
	const bounds = [
		getTodayBoundary(today),
		getDaysAgoBoundary(1, today),
		getDaysAgoBoundary(2, today),
		getWeeksAgoBoundary(1, today),
	];
	let monthsAgo = 1;
	while (bounds[bounds.length - 1].definition >= earliestDateValue) {
		bounds.push(getMonthsAgoBoundary(monthsAgo, today));
		++monthsAgo;
	}
	bounds.push(getMonthsAgoBoundary(monthsAgo, today));
	return bounds;
};

const itemFitsBetweenBoundaries = (
	item: RenderedActivityItem,
	later: Boundary,
	earlier: Boundary,
) => {
	const itemTimestampValue = item.timestamp.valueOf();
	return itemTimestampValue < later.definition && itemTimestampValue >= earlier.definition;
};

export const getBoundaryGroupsForSortedActivityItems = (
	itemsSource: RenderedActivityItem[],
): BoundaryGroup[] => {
	if (itemsSource.length === 0) {
		return [];
	}

	const today = new Date();
	const items = [...itemsSource];
	const boundaries = createBoundaries(today, items[items.length - 1].timestamp);
	const boundaryGroups: BoundaryGroup[] = [];

	for (let boundaryIndex = 0; boundaryIndex < boundaries.length - 2; boundaryIndex++) {
		const laterBoundary = boundaries[boundaryIndex];
		const earlierBoundary = boundaries[boundaryIndex + 1];
		const itemsBetweenTheseBoundaries: RenderedActivityItem[] = [];
		while (items[0] && itemFitsBetweenBoundaries(items[0], laterBoundary, earlierBoundary)) {
			itemsBetweenTheseBoundaries.push(items.shift()!);
		}
		if (itemsBetweenTheseBoundaries.length > 0) {
			boundaryGroups.push({
				label: laterBoundary.label,
				key: laterBoundary.definition,
				items: itemsBetweenTheseBoundaries,
			});
		}
	}

	return boundaryGroups;
};
