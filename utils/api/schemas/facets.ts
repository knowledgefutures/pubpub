import { ZodRawShape, z } from 'zod';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import {
	ALL_FACET_DEFINITIONS,
	FacetDefinition,
	FacetName,
	FacetProp,
	FacetPropType,
	FacetSourceScope,
} from 'facets';
import { UpdateFacetsQuery } from 'server/facets';

extendZodWithOpenApi(z);

type FacetSchema = {
	[name in FacetName]: z.ZodObject<{
		[K in keyof (typeof ALL_FACET_DEFINITIONS)[name]['props']]: (typeof ALL_FACET_DEFINITIONS)[name]['props'][K] extends FacetProp<
			FacetPropType<infer S>
		>
			? S
			: never;
	}>;
};

const facetSchemas = Object.entries(ALL_FACET_DEFINITIONS).reduce((acc, [njame, facet]) => {
	const name = njame as typeof facet extends FacetDefinition<infer N, any> ? N : never;

	const rawShape = Object.entries(facet.props).reduce((accc, [propNjame, prop]) => {
		const propName = propNjame as any;
		// nullable bc that allows the facet to return to higher scope value
		accc[propName] = prop.propType.schema.nullable().openapi({
			description: prop.label,
			example: prop.rootValue,
		});
		return accc;
	}, {} as FacetSchema[typeof name] extends z.ZodObject<infer S extends ZodRawShape> ? S : never);

	acc[name as any] = z.object(rawShape).partial().openapi({
		description: facet.label,
	});
	return acc;
}, {} as FacetSchema);

export const facetSchema = z.object({
	facets: z.object(facetSchemas).partial().default({}) satisfies z.ZodType<
		UpdateFacetsQuery,
		any,
		any
	>,
	scope: z.object({
		kind: z.enum(['community', 'collection', 'pub']),
		id: z.string().uuid(),
	}) satisfies z.ZodType<FacetSourceScope>,
});
