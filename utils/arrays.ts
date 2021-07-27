import { IdIndex, WithId } from 'types';

export const intersperse = <P, Q>(
	arr: P[],
	val: Exclude<Q, Function> | ((i: number) => Exclude<Q, Function>),
) => {
	const res: (P | Q)[] = [];
	arr.forEach((el, index) => {
		res.push(el);
		if (index !== arr.length - 1) {
			const resolvedVal = val instanceof Function ? val(index) : val;
			res.push(resolvedVal);
		}
	});
	return res;
};

export const indexByProperty = <T extends { [key: string]: any }>(
	array: T[],
	property: keyof T,
) => {
	const res: Record<string, T> = {};
	array.forEach((el) => {
		res[el[property]] = el;
	});
	return res;
};

export const indexById = <T extends WithId>(items: T[]): IdIndex<T> => indexByProperty(items, 'id');

export const unique = <T, Q>(array: T[], fn: (t: T, s: Symbol) => Q | Symbol) => {
	const uniqueSymbol = Symbol('unique');
	const res: T[] = [];
	const seenValues = new Set<Q | Symbol>();
	array.forEach((el) => {
		const value = fn(el, uniqueSymbol);
		if (!seenValues.has(value) || value === uniqueSymbol) {
			seenValues.add(value);
			res.push(el);
		}
	});
	return res;
};

export const arraysAreEqual = <T>(
	first: T[],
	second: T[],
	eq: null | ((a: T, b: T) => boolean) = null,
) => {
	if (first.length !== second.length) {
		return false;
	}
	for (let i = 0; i < first.length; i++) {
		const fi = first[i];
		const si = second[i];
		const elementsEqual = eq ? eq(fi, si) : fi === si;
		if (!elementsEqual) {
			return false;
		}
	}
	return true;
};

export const splitArrayOn = <T>(arr: T[], test: (t: T) => boolean): [T[], T[]] => {
	const fails: T[] = [];
	const passes: T[] = [];
	arr.forEach((el) => {
		if (test(el)) {
			passes.push(el);
		} else {
			fails.push(el);
		}
	});
	return [passes, fails];
};

export const arraysHaveSameElements = <T>(first: T[], second: T[]) => {
	return first.every((el) => second.includes(el)) && second.every((el) => first.includes(el));
};

export const pruneFalsyValues = (arr) => arr.filter(Boolean);

export const bucketBy = <T>(arr: T[], getKey: (t: T) => string): Record<string, T[]> => {
	const buckets: Record<string, T[]> = {};
	arr.forEach((item) => {
		const bucketKey = getKey(item);
		const bucket = buckets[bucketKey] || [];
		bucket.push(item);
		buckets[bucketKey] = bucket;
	});
	return buckets;
};

export const flattenOnce = <T>(arr: T[][]): T[] => arr.reduce((a, b) => [...a, ...b], []);
