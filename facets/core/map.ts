import type { FacetDefinition } from './facet';
import type { FacetProp } from './prop';

type MappedFacet<Def extends FacetDefinition, ToType> = {
	[K in keyof Def['props']]: ToType;
};

type FacetMapperMapper<Def extends FacetDefinition, ToType> = (
	key: keyof Def['props'],
	prop: FacetProp,
) => ToType;

export function mapFacet<Def extends FacetDefinition, ToType>(
	def: Def,
	map: FacetMapperMapper<Def, ToType>,
): MappedFacet<Def, ToType> {
	const result: Partial<MappedFacet<Def, ToType>> = {};
	Object.entries(def.props).forEach(([key, prop]) => {
		result[key as keyof Def['props']] = map(key, prop);
	});
	return result as MappedFacet<Def, ToType>;
}
