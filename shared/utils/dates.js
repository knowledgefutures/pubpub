import dateFormat from 'dateformat';

export const formatDate = (
	date,
	{
		includeTime = false,
		includeDate = true,
		includePreposition = false,
		use12HourDate = true,
	} = {},
) => {
	const formattedDate = includeDate
		? (includePreposition ? 'on ' : '') + dateFormat(date, 'mmm dd, yyyy')
		: '';
	if (includeTime) {
		const formattedTime =
			(includePreposition ? 'at ' : '') +
			dateFormat(date, use12HourDate ? 'h:MM TT' : 'HH:MM');
		return `${formattedDate} ${formattedTime}`;
	}
	return formattedDate;
};

export const datesAreSameCalendarDate = (dateOne, dateTwo) =>
	dateOne.toDateString() === dateTwo.toDateString();
