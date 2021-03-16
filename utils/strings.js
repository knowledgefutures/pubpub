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

export const naivePluralize = (str, n) => (n === 1 ? str : `${str}s`);

export const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

export const toTitleCase = (str) =>
	str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

const strConcat = (...strings) => strings.reduce((acc, str) => acc + str, '');

export const joinOxford = (items, { joiner = strConcat, empty = '', ampersand = false } = {}) => {
	const twoAnd = ampersand ? ' & ' : ' and ';
	const manyAnd = ampersand ? ' & ' : ', and ';
	if (items.length === 0) {
		return empty;
	}
	return items.reduce((acc, item, index) =>
		joiner(
			acc,
			items.length === 2 ? twoAnd : index === items.length - 1 ? manyAnd : ', ',
			item,
		),
	);
};

export const btoaUniversal = (input) => {
	try {
		return btoa(input);
	} catch (err) {
		return Buffer.from(input).toString('base64');
	}
};
