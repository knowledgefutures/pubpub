import type * as types from 'types';

import { z } from 'zod';

import { nonRelationFields } from './createGetManyQuery';

export type GetQueryAny = ReturnType<typeof createGetQueryOptions>['_output'];

export const createGetQueryOptions = <
	Schema extends z.ZodObject<any>,
	IncludeOptions extends
		| [
				types.OptionalKeys<Schema['_output']> & string,
				...(types.OptionalKeys<Schema['_output']> & string)[],
		  ]
		| [] = [],
	IncludeDefaults extends [
		// IncludeOptions[number],
		...IncludeOptions[number][],
	] = [],
	NonRelationFields extends [
		Exclude<keyof Schema['_output'] & string, types.OptionalKeys<Schema['_output']>>,
		...Exclude<keyof Schema['_output'] & string, types.OptionalKeys<Schema['_output']>>[],
	] = [
		Exclude<keyof Schema['_output'] & string, types.OptionalKeys<Schema['_output']>>,
		...Exclude<keyof Schema['_output'] & string, types.OptionalKeys<Schema['_output']>>[],
	],
>(
	schema: Schema,
	options: {
		/** Which relations are includeable and what are their defaults */
		include?: {
			/**
			 * Which relations are includeable
			 *
			 * @default [ ]
			 */
			options: IncludeOptions;
			/**
			 * Which relations are included by default
			 *
			 * @default [ ]
			 */
			defaults?: IncludeDefaults;
		};
	},
) => {
	const includeOptions = options?.include?.options;
	return z.object({
		/**
		 * Include certain relations
		 *
		 * @internal
		 */
		include:
			includeOptions && (includeOptions?.length ?? 0) > 0
				? z
						.array(z.enum(includeOptions as Exclude<IncludeOptions, []>))
						.default(options?.include?.defaults ?? [])
				: z.undefined(),

		/**
		 * Which non-relation fields to include in the response
		 *
		 * @default All fields
		 * @internal
		 */
		attributes: z.array(z.enum(nonRelationFields(schema) as NonRelationFields)).optional(),
	});
};
