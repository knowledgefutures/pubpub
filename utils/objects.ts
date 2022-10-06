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

export const mapObject = <Keys extends string, From, To>(
	object: Record<Keys, From>,
	mapper: (from: From) => To,
) => {
	const result: Partial<Record<Keys, To>> = {};
	Object.keys(object).forEach((key: string) => {
		result[key as Keys] = mapper(object[key as Keys]);
	});
	return result as Record<Keys, To>;
};
