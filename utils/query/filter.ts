import type { Prettify } from 'types';

import { type ZodRawShape, type ZodTypeAny, z } from 'zod';

const plainAndBooleanAndArrayFilter = <Z extends ZodTypeAny>(schema: Z) => {
	const plainOrBooleanOrArray = z.union([schema, z.boolean(), z.array(schema)]);

	return z.union([plainOrBooleanOrArray, z.array(plainOrBooleanOrArray)]);
};

const numberFilter = <Z extends z.ZodType<number>>(fieldSchema: Z) =>
	plainAndBooleanAndArrayFilter(
		z.union([
			fieldSchema,
			z.object({
				eq: fieldSchema.optional(),
				gt: fieldSchema.optional(),
				gte: fieldSchema.optional(),
				lt: fieldSchema.optional(),
				lte: fieldSchema.optional(),
				ne: fieldSchema.optional(),
			}),
		]),
	);

const dateFilter = () => {
	const fieldSchema = z.string().datetime().or(z.date());
	return plainAndBooleanAndArrayFilter(
		z.union([
			fieldSchema,
			z.object({
				eq: fieldSchema.optional(),
				gt: fieldSchema.optional(),
				gte: fieldSchema.optional(),
				lt: fieldSchema.optional(),
				lte: fieldSchema.optional(),
				ne: fieldSchema.optional(),
			}),
		]),
	);
};

const booleanFilter = z.boolean();

const stringFilter = <Z extends z.ZodString>(schema: Z, strict?: boolean) =>
	strict
		? z.union([schema, schema.array(), z.boolean()])
		: plainAndBooleanAndArrayFilter(
				z.union([
					schema,
					z.union([
						z.object({
							exact: schema,
						}),
						z.object({
							contains: z.string(),
							not: z.literal(true).optional(),
						}),
					]),
				]),
			).optional();

const enumFilter = <Z extends z.ZodEnum<any>>(schema: Z) => plainAndBooleanAndArrayFilter(schema);

export const generateFilterSchema = <Z extends z.ZodType<any>>(baseSchema: Z) => {
	/** Unwrap nested optionals, nullables, and defaults */
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
		if (baseSchema.isDatetime) {
			return dateFilter();
		}
		return stringFilter(baseSchema, baseSchema.isUUID);
	}
	if (baseSchema instanceof z.ZodNumber) {
		return numberFilter(baseSchema);
	}
	if (baseSchema instanceof z.ZodDate) {
		return dateFilter();
	}

	if (baseSchema instanceof z.ZodBoolean) {
		return booleanFilter;
	}

	return z.any();
};

export type FilterType<T, Kind extends 'UUID' | 'Date' | undefined = undefined> =
	T extends z.ZodType<infer U, any, any>
		? U extends Array<infer X>
			? Array<FilterType<z.ZodType<X, any, any>>>
			: U extends string
				? string extends U
					? Kind extends 'Date'
						? DateFilter
						: Kind extends 'UUID'
							? string | string[] | boolean
							: // @ts-expect-error FIXME: Typescript doesn't understand
								StringFilter<T>
					: EnumFilter<T>
				: U extends number
					? // @ts-expect-error FIXME: Typescript doesn't understand
						NumberFilter<T>
					: U extends Date
						? DateFilter
						: U extends boolean
							? boolean
							: U extends object
								? ObjectFilter<U>
								: never
		: never;

export type EnumFilter<T> =
	T extends z.ZodType<infer U, any, any>
		? U | Array<T extends z.ZodType<infer Y, any, any> ? Y : never>
		: never;
export type StringFilter<T extends z.ZodString> = z.infer<ReturnType<typeof stringFilter<T>>>;
export type NumberFilter<T extends z.ZodType<number>> = z.infer<ReturnType<typeof numberFilter<T>>>;
export type DateFilter = z.infer<ReturnType<typeof dateFilter>>;
export type ObjectFilter<T extends Record<string, any>> = Prettify<{
	[K in keyof T]?: K extends 'id' | `${string}Id`
		? FilterType<z.ZodType<T[K], any, any>, 'UUID'>
		: K extends `${string}At`
			? FilterType<z.ZodType<T[K], any, any>, 'Date'>
			: FilterType<z.ZodType<T[K], any, any>>;
}>;

type FilterT<T> = z.ZodType<FilterType<T>>;

export const generateFilterForModelSchema = <Z extends z.ZodObject<any>>(modelSchema: Z) => {
	const modelWithCreatedAtAndUpdatedAt = modelSchema;

	const result = generateFilterSchema(modelWithCreatedAtAndUpdatedAt) as FilterT<Z>;
	return result;
};
