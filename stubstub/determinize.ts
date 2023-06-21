type Determinized<T extends Record<string, any>, DKeys extends keyof T> = {
	[K in keyof T]: K extends DKeys ? T[K] : never;
};

type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};

/**
 * Create a function that takes an object and returns a new object with only the
 * keys specified in `deterministicKeys`.
 *
 * @param deterministicKeys The keys to keep in the returned object.
 */
export const determinize =
	<T extends Record<string, any>, DKeys extends (keyof T & string)[]>(deterministicKeys: DKeys) =>
	<O extends T>(object: O) => {
		const res = {} as Prettify<Determinized<O, DKeys[number]>>;

		const isDeterministic = (key: string): key is DKeys[number] =>
			deterministicKeys.includes(key);

		Object.keys(object).forEach((key) => {
			if (isDeterministic(key)) {
				res[key] = object[key];
			}
		});
		return res;
	};
