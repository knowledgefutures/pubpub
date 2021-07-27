import mergeWith from 'lodash.mergewith';

export const assignNotNull = (...objs) =>
	mergeWith(...objs, (a, b) => {
		if (Array.isArray(a) && Array.isArray(b)) {
			return b.length === 0 ? a : b;
		}

		return b ?? a;
	});

export const pickKeys = <T extends Record<any, any>, K extends keyof T>(
	object: T,
	keys: readonly K[],
): Pick<T, K> => {
	const nextObject: Partial<Pick<T, K>> = {};
	const objectKeys = Object.keys(object) as any[];
	keys.forEach((key) => {
		if (objectKeys.includes(key)) {
			nextObject[key] = object[key];
		}
	});
	return nextObject as Pick<T, K>;
};
