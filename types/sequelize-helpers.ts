/* eslint-disable-line */
import { Model } from 'sequelize';
// eslint-disable-next-line import/no-unresolved
import { Fn, Col, Literal } from 'sequelize/types/utils';

/**
 * Retrieve what the `update` method of a Sequelize model expects as its first argument, but then
 * serialized.
 */
export type UpdateParams<
	M extends Model,
	U extends Parameters<M['update']>[0] = Parameters<M['update']>[0],
> = {
	[K in keyof U]: U[K] extends Fn | Col | Literal | Model | Model[] | undefined
		? never
		: U[K] extends Col | Fn | Literal | undefined | infer T
		  ? // this weirdness is bc `any extends Date` is boolean, so the result will be `string | null | undefined | T`
		    (T extends Date | null ? true : false) extends true
				? string | null | undefined
				: T
		  : never;
};
