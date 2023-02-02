import React from 'react';

import {
	CascadedFacetType,
	FacetCascadeResult,
	FacetDefinition,
	FacetInstance,
	FacetProp,
	FacetPropType,
	FacetSourceScope,
	PossiblyNullableTypeOfFacetPropType,
} from 'facets';

type RenderFn<Props> = (props: Props) => React.ReactElement;

export type PropTypeEditorComponent<
	PropType extends FacetPropType,
	Nullable extends boolean = true,
> = RenderFn<PropTypeEditorProps<PropType, Nullable>>;

export type PropTypeEditorProps<PropType extends FacetPropType, Nullable extends boolean = true> = {
	prop: FacetProp<PropType>;
	propType: PropType;
	value: PossiblyNullableTypeOfFacetPropType<PropType, Nullable>;
	onUpdateValue: (update: PossiblyNullableTypeOfFacetPropType<PropType, Nullable>) => unknown;
	propSourceInfo: FacetPropSourceInfo;
	facetValue: any;
};

export type PropTypeEditorDefinition<PropType extends FacetPropType> = {
	propType: PropType;
	renderFn: PropTypeEditorComponent<PropType>;
};

export type PropEditors<Def extends FacetDefinition> = {
	[K in keyof Def['props']]: PropTypeEditorComponent<Def['props'][K]['propType']>;
};

export type FacetPropEditorProps<
	Def extends FacetDefinition,
	PropName extends keyof Def['props'],
	Nullable extends boolean = true,
> = PropTypeEditorProps<Def['props'][PropName]['propType'], Nullable> & {
	facetValue: CascadedFacetType<Def>;
};

export type GenericFacetEditorProps<Def extends FacetDefinition> = {
	facetDefinition: Def;
	cascadeResult: FacetCascadeResult<Def>;
	currentScope: FacetSourceScope;
	propEditors: Partial<PropEditors<Def>>;
	description?: React.ReactNode;
	displayStyle?: FacetEditorDisplayStyle;
	selfContained?: boolean;
	isPersisting?: boolean;
	onUpdateValue: (patch: Partial<FacetInstance<Def>>) => unknown;
};

export type FacetEditorCreationOptions<Def extends FacetDefinition> = Pick<
	GenericFacetEditorProps<Def>,
	'propEditors' | 'description'
>;

export type SpecificFacetEditorProps<Def extends FacetDefinition> = Omit<
	GenericFacetEditorProps<Def>,
	'propEditors' | 'facetDefinition'
>;

export type FacetEditorComponent<Def extends FacetDefinition = FacetDefinition> = React.FC<
	SpecificFacetEditorProps<Def>
>;

export type FacetPropSourceInfo = {
	isValueLocal: boolean;
	contributingScopes: FacetSourceScope[];
};

export type FacetEditorDisplayStyle = 'settings' | 'compact';
