import fuzzysearch from 'fuzzysearch';

import { DEFAULT_ROLES } from 'types';

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
