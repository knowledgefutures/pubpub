import * as types from 'types';
import { z } from 'zod';

import { createGetManyQueryOptions } from './createGetManyQuery';

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
>(
	schema: Schema,
	options: {
		/**
		 * Which relations are includeable and what are their defaults
		 */
		include?: {
			/**
			 * Which relations are includeable
			 *
			 * @default []
			 */
			options: IncludeOptions;
			/**
			 * Which relations are included by default
			 *
			 * @default []
			 */
			defaults?: IncludeDefaults;
		};
	},
) => {
	const manyQuery = createGetManyQueryOptions(schema, options);

	return manyQuery.unwrap().pick({ attributes: true, include: true }).default({});
};
