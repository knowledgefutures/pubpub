import dateFormat from 'dateformat';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const formatDate = (
	date: Date | string,
	{
		includeTime = false,
		includeDate = true,
		includePreposition = false,
		use12HourDate = true,
		inUtcTime = false,
	} = {},
) => {
	const formatMask = `${inUtcTime ? 'UTC:' : ''}mmm dd, yyyy`;
	const formattedDate = includeDate
		? (includePreposition ? 'on ' : '') + dateFormat(date, formatMask)
		: '';
	if (includeTime) {
		const formattedTime =
			(includePreposition ? 'at ' : '') +
			dateFormat(date, use12HourDate ? 'h:MM TT' : 'HH:MM');
		return `${formattedDate} ${formattedTime}`;
	}
	return formattedDate;
};

export const datesAreSameCalendarDate = (dateOne: Date, dateTwo: Date) =>
	dateOne.toDateString() === dateTwo.toDateString();

export const timeAgoBaseProps = {
	minPeriod: 60,
	formatter: (value, unit, suffix) => {
		if (unit === 'second') {
			return 'just now';
		}
		let newUnit = unit;
		if (value > 1) {
			newUnit += 's';
		}
		return `${value} ${newUnit} ${suffix}`;
	},
};

export const getLocalDateMatchingUtcCalendarDate = (utcDate: Date | string) => {
	const formattedUtcDate = dateFormat(utcDate, 'UTC:yyyy-mm-dd');
	const localDateOnSameDay = new Date(formattedUtcDate);
	const returnDate = new Date(utcDate);
	returnDate.setMinutes(returnDate.getMinutes() + localDateOnSameDay.getTimezoneOffset());
	return returnDate;
};

export const getReadableDateInYear = (date: Date) => {
	const month = months[date.getMonth()];
	const dateInMonth = date.getDate();
	return `${month} ${dateInMonth}`;
};

export const isValidDate = (date: string | number | Date) =>
	!Number.isNaN(new Date(date).getTime());
