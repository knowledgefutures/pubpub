export type Falsy = false | null | undefined | '' | 0;
export type Maybe<X> = X extends Falsy ? never : X | Falsy;
export type Some<X> = X extends Falsy ? never : X;
export type DefinitelyHas<X extends {}, Keys> = X & { [k in keyof X & Keys]: Some<X[k]> };
export type MightHave<X extends {}, Keys extends keyof X> = Pick<Partial<X>, Keys> & Omit<X, Keys>;

type PatchFnUpdaterArg<T> = (current: T) => Partial<T>;
type PatchFnPatchArg<T> = Partial<T>;
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
