export type Falsy = false | null | undefined | '' | 0;
export type Maybe<X> = X extends Falsy ? never : X | Falsy;
export type Some<X> = X extends Falsy ? never : X;

export type DefinitelyHas<X extends Record<string, any>, Keys extends keyof X> = X & {
	[k in keyof X & Keys]: Some<X[k]>;
};

export type MaybeHas<X extends {}, Keys extends string> = Omit<X, Keys> & {
	[k in keyof X & Keys]?: X[k];
};

export type MightHave<X extends {}, Keys extends keyof X> = Pick<Partial<X>, Keys> & Omit<X, Keys>;

type PatchFnPatchArg<T> = null | Partial<T>;
type PatchFnUpdaterArg<T> = (current: T) => PatchFnPatchArg<T>;
export type PatchFnArg<T> = PatchFnPatchArg<T> | PatchFnUpdaterArg<T>;
export type PatchFn<T> = (arg: PatchFnArg<T>) => unknown;

export type Diff<T> = { from: T; to: T };

export type WithId = { id: string };
export type IdIndex<T extends WithId> = Record<string, T>;

export type Callback<T = void> = T extends void ? () => unknown : (t: T) => unknown;

export type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends Array<infer I> ? Array<DeepPartial<I>> : DeepPartial<T[P]>;
};

export type OmitSequelizeProvidedFields<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

export type Writeable<T> = { -readonly [P in keyof T]: T[P] };

/**
 * PickByValue (from `utility-types`)
 * @desc From `T` pick a set of properties by value matching `ValueType`.
 * Credit: [Piotr Lewandowski](https://medium.com/dailyjs/typescript-create-a-condition-based-subset-types-9d902cea5b8c)
 * @example
 *   type Props = { req: number; reqUndef: number | undefined; opt?: string; };
 *
 *   // Expect: { req: number }
 *   type Props = PickByValue<Props, number>;
 *   // Expect: { req: number; reqUndef: number | undefined; }
 *   type Props = PickByValue<Props, number | undefined>;
 */
export type PickByValue<T, ValueType> = Pick<
	T,
	{ [Key in keyof T]-?: T[Key] extends ValueType ? Key : never }[keyof T]
>;

/**
 * PickByValueExact (from `utility-types`)
 * @desc From `T` pick a set of properties by value matching exact `ValueType`.
 * @example
 *   type Props = { req: number; reqUndef: number | undefined; opt?: string; };
 *
 *   // Expect: { req: number }
 *   type Props = PickByValueExact<Props, number>;
 *   // Expect: { reqUndef: number | undefined; }
 *   type Props = PickByValueExact<Props, number | undefined>;
 */
export type PickByValueExact<T, ValueType> = Pick<
	T,
	{
		[Key in keyof T]-?: [ValueType] extends [T[Key]]
			? [T[Key]] extends [ValueType]
				? Key
				: never
			: never;
	}[keyof T]
>;

export type OptionalKeys<T> = {
	[K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

/**
 * Pretty print an object type, unwraps it so to say
 */
export type Prettify<T> = {
	[P in keyof T]: T[P];
} & {};
