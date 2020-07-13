import mergeWith from 'lodash.mergewith';

export const assignNotNull = (...objs) =>
	mergeWith(...objs, (a, b) => {
		if (Array.isArray(a) && Array.isArray(b)) {
			return b.length === 0 ? a : b;
		}

		return b ?? a;
	});
