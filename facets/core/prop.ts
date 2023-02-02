import { FacetPropType, NullableTypeOfPropType, TypeOfFacetPropType } from './propType';

type IsNeverNull<T> = Extract<T, null> extends never ? true : false;

export type CascadeStrategy = 'overwrite' | 'concat';

export type FacetPropOptions<
	// The PropType of the prop.
	PropType extends FacetPropType,
	// The `rootValue` provided, which may be `null`.
	// We provide this as a type parameter so that TypeScript will infer its narrowest -- most
	// specific -- type and preserve that information in the inferred return type. This lets us
	// determine statically whether a facet prop will ever be null and adjust its TypeScript
	// definitions accordingly.
	RootValue extends NullableTypeOfPropType<PropType>,
	// The way this prop should cascade (defaults to overwriting values from upper scopes)
	Cascade extends CascadeStrategy = 'overwrite',
> = {
	// The value of this prop at the "root" of PubPub -- in the absence of any other facet instances
	// that override it, what value does this prop have?
	rootValue: RootValue;
	// Explains how this prop should cascade from higher to lower scopes.
	cascade?: Cascade;
	// A human-readable label for this prop
	label?: string;
};

export type FacetProp<
	PropType extends FacetPropType = FacetPropType,
	RootValue extends NullableTypeOfPropType<PropType> = NullableTypeOfPropType<PropType>,
	Cascade extends CascadeStrategy = any,
> =
	// Everything in the FacetPropOptions above...
	Omit<FacetPropOptions<PropType, RootValue>, 'cascade'> & {
		__facetProp: true;
		// Plus the provided propType.
		propType: PropType;
		// Plus a non-nullable cascade strategy with a default value applied.
		cascade: Cascade;
	};

export type RootValueOfFacetProp<Prop extends FacetProp> = Prop['rootValue'];
export type TypeOfFacetProp<Prop extends FacetProp> = TypeOfFacetPropType<Prop['propType']>;
export type NullableTypeOfFacetProp<Prop extends FacetProp> = NullableTypeOfPropType<
	Prop['propType']
>;

export type CascadedTypeOfFacetProp<Prop extends FacetProp> =
	// If the root value of the prop is non-null...
	IsNeverNull<RootValueOfFacetProp<Prop>> extends true
		? // ...then we'll never get null as a cascaded value for this prop
		  TypeOfFacetProp<Prop>
		: // Otherwise, we might.
		  NullableTypeOfFacetProp<Prop>;

// Creates a prop definition.
export const prop = <
	PropType extends FacetPropType,
	RootValue extends NullableTypeOfPropType<PropType>,
	Cascade extends CascadeStrategy = 'overwrite',
>(
	propType: PropType,
	options: FacetPropOptions<PropType, RootValue, Cascade>,
): FacetProp<PropType, RootValue, Cascade> => {
	const { cascade: providedCascade } = options;
	const cascade: Cascade = providedCascade ?? ('overwrite' as Cascade);
	return {
		...options,
		propType,
		cascade,
		__facetProp: true,
	};
};
