// import * as types from 'types';
import type { OptionalKeys } from 'types';

import { z } from 'zod';

import { generateFilterForModelSchema } from './filter';

type OptionalKeysNoCreatedAtUpdatedAt<T> = Exclude<OptionalKeys<T>, 'createdAt' | 'updatedAt'>;

export function nonRelationFields(schema: z.ZodObject<any>) {
	return Object.entries(schema.shape)
		.map(([key, value]) => {
			if (key === 'createdAt' || key === 'updatedAt') {
				return key;
			}

			if (value instanceof z.ZodOptional) {
				return '';
			}

			return key;
		})
		.filter(Boolean) as string[];
}

export type GetManyQueryAny = ReturnType<typeof createGetManyQueryOptions>['_output'];
/** Create a query schema for getting many items from provided schema */
export function createGetManyQueryOptions<
	Schema extends z.ZodObject<any>,
	IncludeOptions extends
		| [
				OptionalKeysNoCreatedAtUpdatedAt<Schema['_output']> & string,
				...(OptionalKeysNoCreatedAtUpdatedAt<Schema['_output']> & string)[],
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
	SortByDefault extends SortOptions[number] | 'createdAt' | 'updatedAt' = 'createdAt',
	NonRelationFields extends [
		Exclude<
			keyof Schema['_output'] & string,
			OptionalKeysNoCreatedAtUpdatedAt<Schema['_output']>
		>,
		...Exclude<
			keyof Schema['_output'] & string,
			OptionalKeysNoCreatedAtUpdatedAt<Schema['_output']>
		>[],
	] = [
		Exclude<
			keyof Schema['_output'] & string,
			OptionalKeysNoCreatedAtUpdatedAt<Schema['_output']>
		>,
		...Exclude<
			keyof Schema['_output'] & string,
			OptionalKeysNoCreatedAtUpdatedAt<Schema['_output']>
		>[],
	],
	OmittedSchema extends z.ZodObject<
		Omit<Pick<Schema['shape'], NonRelationFields[number]>, keyof OmitOptions>
	> = z.ZodObject<Omit<Pick<Schema['shape'], NonRelationFields[number]>, keyof OmitOptions>>,
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
		/** Which fields are sortable. */
		sort?: {
			/**
			 * Which fields are sortable. `createdAt` and `updatedAt` are always sortable.
			 *
			 * @default ['createdAt', 'updatedAt']
			 */
			options: SortOptions;
			/**
			 * Which field is the default sort
			 *
			 * If only a string is provided, it will be sorted by that field in descending order
			 *
			 * @example {undefined} 'updatedAt', 'ASC'
			 *
			 * @default ['createdAt', 'DESC']
			 */
			default?: SortByDefault | [SortByDefault, 'ASC' | 'DESC'];
		};
		/**
		 * Omit certain fields from being filterable.
		 *
		 * This is useful for very complex fields that would either not benefit from being
		 * filterable, or would be too complex to implement.
		 */
		omitFromFilter?: OmitOptions;
	},
) {
	const { sort } = options;
	const { options: sortOptions, default: defaultSort } = sort ?? { options: [] };

	const omit = options.omitFromFilter ?? {};
	const includeOptions = options?.include?.options;

	const nonAssocFields = nonRelationFields(schema).reduce(
		(acc, curr) => ({ ...acc, [curr]: true }),
		{} as { [K in NonRelationFields[number]]: true },
	);

	const filterOptions = generateFilterForModelSchema(
		/**
		 * This is done to make sure that the omitted fields are not included in the filter Just
		 * doing `.omit` will not provide proper type inference
		 */
		schema.omit({ ...omit }).pick(nonAssocFields) as unknown as OmittedSchema,
	);

	const [defaultSortBy = 'createdAt', defaultOrderBy = 'DESC'] = Array.isArray(defaultSort)
		? defaultSort
		: [defaultSort];

	return z.optional(
		z.intersection(
			z.object({
				/**
				 * Pagination
				 *
				 * @internal
				 */
				limit: z.coerce.number().int().positive().default(10),
				/**
				 * Pagination
				 *
				 * @internal
				 */
				offset: z.coerce.number().int().default(0),
				/**
				 * Sorting
				 *
				 * @internal
				 */
				sortBy: z
					.enum(['createdAt', 'updatedAt', ...sortOptions])
					// @ts-expect-error This works, but Zod doesn't like it
					.default(defaultSortBy),
				/**
				 * Sorting order
				 *
				 * @default 'DESC'
				 * @internal
				 */
				orderBy: z.enum(['ASC', 'DESC']).default(defaultOrderBy),
				/**
				 * Here you can specify filters for certain fields
				 *
				 * There are 4 types of filters for different kinds of fields, which can either be
				 * supplied directly, or as an array of filters.
				 *
				 * **String fields**
				 *
				 * String fields can take the following types as options
				 *
				 * - `string` - a string that must match exactly
				 *
				 * @internal
				 */
				filter: filterOptions.optional(),
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
				 * @default
				 * All fields
				 *
				 * @internal
				 */
				attributes: z
					.array(z.enum(nonRelationFields(schema) as NonRelationFields))
					.optional(),
			}),
			filterOptions,
		),
	);
}
