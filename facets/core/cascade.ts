import type { FacetProp, NullableTypeOfFacetProp } from './prop';
import type {
	FacetDefinition,
	FacetValue,
	FacetPropCascadeResult,
	WithFacetSource,
	PropCascadeContribution,
	PropCascadeResult,
	FacetCascadeResult,
	FacetInstanceStack,
} from './facet';
import { FacetCascadeNotImplError } from './errors';
import { mapFacet } from './map';

function cascadeProp<Prop extends FacetProp>(
	prop: Prop,
	sources: WithFacetSource<NullableTypeOfFacetProp<Prop>>[],
): FacetPropCascadeResult<Prop> {
	const { cascade: cascadeStrategy } = prop;
	if (cascadeStrategy === 'overwrite') {
		type PropWithCascade = Prop & { cascade: 'overwrite' };
		const value: PropCascadeResult<PropWithCascade> = sources
			.map((s) => s.value)
			.reduce((a, b) => b ?? a, null as any);
		return {
			sources: sources as WithFacetSource<PropCascadeContribution<PropWithCascade>>[],
			value,
		};
	}
	if (cascadeStrategy === 'concat') {
		type PropWithCascade = Prop & { cascade: 'concat' };
		const value: PropCascadeResult<PropWithCascade> = sources
			.map((s) => (s.value ?? []) as any[])
			.reduce((a, b) => [...a, ...b], []);
		return {
			sources: sources as WithFacetSource<PropCascadeContribution<PropWithCascade>>[],
			value,
		};
	}
	throw new FacetCascadeNotImplError(cascadeStrategy);
}

export function cascade<Def extends FacetDefinition>(
	def: Def,
	stack: FacetInstanceStack<Def>,
): FacetCascadeResult<Def> {
	const props = mapFacet(def, (key, prop) => {
		const propInstances = stack.map((instance) => {
			const { scope, value, facetBindingId } = instance;
			return { scope, facetBindingId, value: value[key] };
		});
		return cascadeProp(prop, [
			{ scope: { kind: 'root' }, value: prop.rootValue, facetBindingId: null },
			...propInstances,
		]);
	}) as FacetCascadeResult<Def>['props'];
	const value = mapFacet(def, (key) => {
		return props[key].value;
	}) as FacetValue<Def>;
	return { props, value, stack };
}
