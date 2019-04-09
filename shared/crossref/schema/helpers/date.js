/**
 * Renders a date
 */
export default (kind, date, mediaType = 'online') => {
	if (!date) {
		return {};
	}
	return {
		[kind]: {
			'@media_type': mediaType,
			month: `0${date.getMonth() + 1}`.slice(-2),
			day: date.getDate().toString(),
			year: date.getFullYear().toString(),
		},
	};
};
