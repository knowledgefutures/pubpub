import fuzzysearch from 'fuzzysearch';

const DEFAULT_ROLES = [
	'Conceptualization',
	'Methodology',
	'Software',
	'Validation',
	'Formal Analysis',
	'Investigation',
	'Resources',
	'Data Curation',
	'Writing – Original Draft Preparation',
	'Writing – Review & Editing',
	'Visualization',
	'Supervision',
	'Project Administration',
	'Peer Review',
	'Funding Acquisition',
	'Illustrator',
];

// eslint-disable-next-line import/prefer-default-export
export const getFilteredRoles = (query, existingRoles) => {
	const addNewRoleOption = DEFAULT_ROLES.reduce((prev, curr) => {
		if (curr.toLowerCase() === query.toLowerCase()) {
			return false;
		}
		return prev;
	}, true);
	const newRoleOption = query && addNewRoleOption ? [query] : [];
	const allRoles = [...newRoleOption, ...DEFAULT_ROLES];
	const output = allRoles
		.filter((item) => {
			const fuzzyMatchRole = fuzzysearch(query.toLowerCase(), item.toLowerCase());
			const alreadyUsed = existingRoles.indexOf(item) > -1;
			return !alreadyUsed && fuzzyMatchRole;
		})
		.sort((foo, bar) => {
			if (foo.toLowerCase() < bar.toLowerCase()) {
				return -1;
			}
			if (foo.toLowerCase() > bar.toLowerCase()) {
				return 1;
			}
			return 0;
		});
	return output;
};
