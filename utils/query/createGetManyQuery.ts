import { z } from 'zod';
import * as types from 'types';
import { generateFilterForModelSchema } from './filter';

function nonRelationFields(schema: z.ZodObject<any>) {
	return Object.entries(schema.shape)
		.map(([key, value]) => {
			if (value instanceof z.ZodOptional) {
				return;
			}

			// eslint-disable-next-line consistent-return
			return key;
		})
		.filter(Boolean) as string[];
}

export type GetManyQueryAny = ReturnType<typeof createGetManyQueryOptions>['_output'];
/**
 * Create a query schema for getting many items from provided schema
 */
export function createGetManyQueryOptions<
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
	SortOptions extends [
		// keyof Schema['_output'] & string,
		...(keyof Schema['_output'] & string)[],
	] = [],
	OmitOptions extends { [K in keyof Schema['_output'] & string]?: true } = {},
	SortDefault extends SortOptions[number] | 'createdAt' | 'updatedAt' = 'createdAt',
	OmittedSchema extends z.ZodObject<Omit<Schema['shape'], keyof OmitOptions>> = z.ZodObject<
		Omit<Schema['shape'], keyof OmitOptions>
	>,
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
		/**
		 * Which fields are sortable.
		 */
		sort?: {
			/**
			 * Which fields are sortable.
			 * `createdAt` and `updatedAt` are always sortable.
			 *
			 * @default ['createdAt', 'updatedAt']
			 */
			options: SortOptions;
			/**
			 * Which field is the default sort
			 *
			 * @default 'createdAt'
			 */
			default?: SortDefault;
		};
		/**
		 * Omit certain fields from being filterable.
		 *
		 * This is useful for very complex fields that would either not
		 * benefit from being filterable, or would be too complex to
		 * implement.
		 */
		omitFromFilter?: OmitOptions;
	},
) {
	const { sort } = options;
	const { options: sortOptions, default: defaultSort } = sort ?? { options: [] };

	const omit = options.omitFromFilter ?? {};
	const includeOptions = options?.include?.options;
	return z
		.object({
			/**
			 * Pagination
			 */
			limit: z.coerce.number().int().positive().default(10),
			/**
			 * Pagination
			 */
			offset: z.coerce.number().int().default(0),
			/**
			 * Sorting
			 */
			sort: z
				.enum(['createdAt', 'updatedAt', ...sortOptions])
				// @ts-expect-error This works, but Zod doesn't like it
				.default(defaultSort ?? 'createdAt'),
			/**
			 * Sorting order
			 *
			 * @default 'DESC'
			 */
			order: z.enum(['ASC', 'DESC']).default('DESC'),
			/**
			 * Here you can specify filters for certain fields
			 *
			 * There are 4 types of filters for different kinds of fields, which can either be
			 * supplied directly, or as an array of filters.
			 *
			 * ## String fields
			 *
			 * String fields can take the following types as options
			 * - `string` - a string that must match exactly
			 */
			filter: generateFilterForModelSchema(
				/**
				 * This is done to make sure that the omitted fields are not included in the filter
				 * Just doing `.omit` will not provide proper type inference
				 */
				schema.omit(omit) as unknown as OmittedSchema,
			).optional(),
			/**
			 * Include certain relations
			 */
			include:
				includeOptions && (includeOptions?.length ?? 0) > 1
					? z
							.array(z.enum(includeOptions as Exclude<IncludeOptions, []>))
							.default(options?.include?.defaults ?? [])
					: z.never(),

			/**
			 * Which non-relation fields to include in the response
			 *
			 * @default All fields
			 */
			attributes: z.array(z.enum(nonRelationFields(schema) as NonRelationFields)).optional(),
		})
		.optional();
}
