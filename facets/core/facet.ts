import {
	FacetProp,
	CascadedTypeOfFacetProp,
	NullableTypeOfFacetProp,
	TypeOfFacetProp,
} from './prop';
import { FacetPropType } from './propType';

export type FacetProps = Record<string, FacetProp<FacetPropType, any>>;

type FacetPropsDefinitionTypeOf<Props extends FacetProps, FallbackValue = never> = {
	[K in keyof Props]: FallbackValue | CascadedTypeOfFacetProp<Props[K]>;
};

export type FacetSourceScope =
	| { kind: 'community' | 'collection' | 'pub'; id: string }
	| { kind: 'root'; id?: null };

export type WithFacetSource<T> = {
	scope: FacetSourceScope;
	facetBindingId: null | string;
	value: T;
};

export type FacetOptions<Name extends string, Props extends FacetProps> = {
	name: Name;
	props: Props;
	label?: string;
};

export type FacetDefinition<
	Name extends string = string,
	Props extends FacetProps = FacetProps,
> = FacetOptions<Name, Props> & {
	readonly props: Props;
	__facet: true;
};

export type CascadedFacetType<Def extends FacetDefinition> = FacetPropsDefinitionTypeOf<
	Def['props'],
	never
>;

export type FacetInstance<Def extends FacetDefinition> = FacetPropsDefinitionTypeOf<
	Def['props'],
	null
>;

export type FacetInstanceStack<Def extends FacetDefinition> = WithFacetSource<FacetInstance<Def>>[];

export type PropCascadeContribution<Prop extends FacetProp> = Prop['cascade'] extends 'concat'
	? TypeOfFacetProp<Prop> & any[]
	: NullableTypeOfFacetProp<Prop>;

export type PropCascadeResult<Prop extends FacetProp> = Prop['cascade'] extends 'concat'
	? TypeOfFacetProp<Prop> & any[]
	: CascadedTypeOfFacetProp<Prop>;

export type FacetPropCascadeResult<Prop extends FacetProp> = {
	value: PropCascadeResult<Prop>;
	sources: WithFacetSource<PropCascadeContribution<Prop>>[];
};

export type FacetValue<Def extends FacetDefinition> = {
	[K in keyof Def['props']]: PropCascadeResult<Def['props'][K]>;
};

export type FacetCascadeResult<Def extends FacetDefinition> = {
	value: FacetValue<Def>;
	props: { [K in keyof Def['props']]: FacetPropCascadeResult<Def['props'][K]> };
	stack: FacetInstanceStack<Def>;
};

export const facet = <Name extends string, Props extends FacetProps>(
	options: FacetOptions<Name, Props>,
): FacetDefinition<Name, Props> => {
	return { ...options, __facet: true };
};
