export const toTitleCase = (str) =>
	str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

export const joinOxford = (arr) =>
	arr.reduce(
		(a, x, i) => a + (arr.length === 2 ? ' and ' : i === arr.length - 1 ? ', and ' : ', ') + x,
	);
