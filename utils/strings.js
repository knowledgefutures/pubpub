import { remove as removeDiacritics } from 'diacritics';

export const slugifyString = (input) => {
	if (typeof input !== 'string') {
		console.error('input is not a valid string');
		return '';
	}

	return removeDiacritics(input)
		.replace(/ /g, '-')
		.replace(/[^a-zA-Z0-9-]/gi, '')
		.toLowerCase();
};

export const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

export const toTitleCase = (str) =>
	str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

export const joinOxford = (arr) =>
	arr.reduce(
		(a, x, i) => a + (arr.length === 2 ? ' and ' : i === arr.length - 1 ? ', and ' : ', ') + x,
	);
