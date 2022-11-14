import { formatDate } from 'utils/dates';

export const renderTimeLabelForDate = (date: Date) => {
	const dateLabel = formatDate(date);
	const timeLabel = formatDate(date, { includeDate: false, includeTime: true });
	return { date: dateLabel, time: timeLabel };
};
