import { z, ZodRawShape, ZodTypeAny } from 'zod';

import { Op, WhereOptions } from 'sequelize';

const plainAndBooleanAndArrayFilter = <Z extends ZodTypeAny>(schema: Z) =>
	z.union([schema, z.boolean(), z.array(schema)]).optional();

const dateNumberFilter = <Z extends ZodTypeAny>(fieldSchema: Z) =>
	plainAndBooleanAndArrayFilter(
		z.union([
			fieldSchema,
			z.object({
				eq: fieldSchema.optional(),
				gt: fieldSchema.optional(),
				gte: fieldSchema.optional(),
				lt: fieldSchema.optional(),
				lte: fieldSchema.optional(),
				invert: z.boolean().optional(),
			}),
		]),
	);

const booleanFilter = z.boolean();

const stringFilter = <Z extends z.ZodString>(schema: Z) =>
	plainAndBooleanAndArrayFilter(
		z.union([
			schema,
			z.union([
				z.object({
					exact: schema.optional(),
					contains: z.undefined(),
					invert: z.undefined(),
				}),
				z.object({
					exact: z.undefined(),
					contains: z.string().optional(),
					invert: z.boolean().optional(),
				}),
				z.object({
					exact: z.undefined(),
					contains: z.undefined(),
					invert: z.undefined(),
				}),
			]),
		]),
	).optional();

const enumFilter = <Z extends z.ZodEnum<any>>(schema: Z) => plainAndBooleanAndArrayFilter(schema);

export const generateFilterSchema = <Z extends z.ZodType<any>>(baseSchema: Z) => {
	/**
	 * Unwrap nested optionals, nullables, and defaults
	 */
	while (
		baseSchema instanceof z.ZodOptional ||
		baseSchema instanceof z.ZodNullable ||
		baseSchema instanceof z.ZodDefault
	) {
		if (baseSchema instanceof z.ZodDefault) {
			baseSchema = baseSchema.removeDefault();
		}
		if (baseSchema instanceof z.ZodNullable || baseSchema instanceof z.ZodOptional) {
			baseSchema = baseSchema.unwrap();
		}
	}

	if (baseSchema instanceof z.ZodUnion || baseSchema instanceof z.ZodDiscriminatedUnion) {
		return z.union(baseSchema.options.map(generateFilterSchema)) as any;
	}

	if (baseSchema instanceof z.ZodArray) {
		return z.array(generateFilterSchema(baseSchema.element)) as any;
	}

	if (baseSchema instanceof z.ZodObject) {
		const shape = Object.entries(baseSchema.shape as ZodRawShape).reduce(
			(acc, [key, value]) => {
				acc[key] = generateFilterSchema(value).optional();
				return acc;
			},
			{} as ZodRawShape,
		);
		return z.object(shape);
	}

	if (baseSchema instanceof z.ZodEnum) {
		return enumFilter(baseSchema);
	}
	if (baseSchema instanceof z.ZodString) {
		return stringFilter(baseSchema);
	}
	if (baseSchema instanceof z.ZodNumber || baseSchema instanceof z.ZodDate) {
		return dateNumberFilter(baseSchema);
	}
	if (baseSchema instanceof z.ZodBoolean) {
		return booleanFilter;
	}

	return z.any();
};

export type FilterType<T> = T extends z.ZodType<infer U, any, any>
	? U extends Array<infer X>
		? Array<FilterType<z.ZodType<X, any, any>>>
		: U extends string
		? string extends U
			? // @ts-expect-error FIXME: Typescript doesn't understand that if
			  // `U extends string` then `T extends z.ZodType<string>`
			  StringFilter<T>
			: EnumFilter<T>
		: U extends number | Date
		? // @ts-expect-error FIXME: Typescript doesn't understand that if
		  // `U extends number | Date` then `T extends z.ZodType<number> | z.ZodType<Date>`
		  NumberDateFilter<T>
		: U extends boolean
		? boolean
		: U extends object
		? ObjectFilter<U>
		: never
	: never;

type EnumFilter<T> = T extends z.ZodType<infer U, any, any>
	? U | Array<T extends z.ZodType<infer Y, any, any> ? Y : never>
	: never;
type StringFilter<T extends z.ZodString> = z.infer<ReturnType<typeof stringFilter<T>>>;
type NumberDateFilter<T extends z.ZodType<number> | z.ZodType<Date>> = z.infer<
	ReturnType<typeof dateNumberFilter<T>>
>;
type ObjectFilter<T extends Record<string, any>> = {
	[K in keyof T]?: FilterType<z.ZodType<T[K], any, any>>;
};

type FilterT<T> = z.ZodType<FilterType<T>>;

export const generateFilterForModelSchema = <Z extends z.ZodObject<any>>(modelSchema: Z) => {
	const result = generateFilterSchema(
		modelSchema.extend({
			createdAt: z.date(),
			updatedAt: z.date(),
		}),
	) as FilterT<Z>;
	return result;
};

type ZodTypes =
	| z.ZodNumber
	| z.ZodString
	| z.ZodDate
	| z.ZodBoolean
	| z.ZodEnum<any>
	| z.ZodObject<any>;

const buildFieldWhereClause = <T extends ZodTypes>(filterField: FilterType<T>) => {
	if (Array.isArray(filterField)) {
		return { [Op.or]: filterField.map(buildFieldWhereClause) };
	}

	if (typeof filterField === 'boolean') {
		if (filterField) {
			return { [Op.not]: null };
		}

		return { [Op.is]: null };
	}

	if (typeof filterField === 'object') {
		const w = Object.entries(filterField).reduce((acc, [key, value]) => {
			if (key === 'exact') {
				acc[Op.eq] = value;
			}
			if (key === 'contains') {
				acc[Op.iLike] = `%${value}%`;
			}

			if (key === 'invert') {
				acc[Op.not] = value;
			}

			if (['gt', 'lt', 'gte', 'lte', 'eq'].includes(key)) {
				acc[Op[key]] = value;
			}

			return acc;
		}, {} as any);

		return w;
	}

	return filterField;
};

/**
 * Builds a Sequelize `where` clause based on the provided filters.
 * @param filters - An object containing the filters to apply to the query.
 * @returns A Sequelize `where` clause object.
 */
export const buildWhereClause = <T extends ObjectFilter<any>>(filters: T) => {
	const where: WhereOptions<z.infer<FilterType<T>>> = {};

	Object.keys(filters).forEach((key) => {
		const filterField = filters[key];
		where[key] = buildFieldWhereClause(filterField);
	});

	return where;
};
