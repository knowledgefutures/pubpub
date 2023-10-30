import { Attributes, CreationAttributes, CreationOptional } from 'sequelize';
import { Model } from 'sequelize-typescript';

type Prettify<T> = {
	[P in keyof T]: T[P];
} & {};

export type SerializedModel<
	T extends Model,
	C extends boolean = false,
	S extends C extends false ? Attributes<T> : CreationAttributes<T> = C extends false
		? Attributes<T>
		: CreationAttributes<T>,
> = Prettify<{
	[P in keyof S]: S[P] extends Model | Model[] | undefined
		? S[P] extends Array<infer M extends Model> | undefined
			? SerializedModel<M, C>[] | undefined
			: SerializedModel<NonNullable<S[P]>, C> | undefined
		: S[P] extends Date | null
		? S[P] extends Date
			? string
			: string | null
		: S[P] extends CreationOptional<infer R>
		? R
		: S[P];
}>;

export type RecursiveCreationAttributes<T extends Model> = SerializedModel<T, true>;
