import { TypeOf, ZodSchema } from 'zod';

import { PostgresDatatype } from '../types/database';

type AnyExtension = Record<string, any>;

type FacetPropTypeOptions<
	Schema extends ZodSchema = ZodSchema,
	Extension extends AnyExtension = AnyExtension,
> = {
	name?: string;
	schema: Schema;
	postgresType: PostgresDatatype;
	extension?: Extension;
};

export type FacetPropType<
	Schema extends ZodSchema = ZodSchema,
	Extension = AnyExtension,
> = FacetPropTypeOptions<Schema, Extension> & {
	__facetPropType: true;
	extension: Extension;
};

export type TypeOfFacetPropType<PropType extends FacetPropType> = TypeOf<PropType['schema']>;

export type PossiblyNullableTypeOfFacetPropType<
	PropType extends FacetPropType,
	Nullable extends boolean = false,
> = TypeOfFacetPropType<PropType> | (Nullable extends true ? null : never);

export type NullableTypeOfPropType<PropType extends FacetPropType> =
	null | TypeOfFacetPropType<PropType>;

export const propType = <Schema extends ZodSchema, Extension extends AnyExtension>(
	options: FacetPropTypeOptions<Schema, Extension>,
): FacetPropType<Schema, Extension> => {
	return {
		...options,
		extension: options.extension || ({} as Extension),
		__facetPropType: true,
	};
};
