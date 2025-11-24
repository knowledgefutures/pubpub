import type { FacetDefinition } from 'facets';

import type {
	FacetEditorComponent,
	FacetEditorCreationOptions,
	SpecificFacetEditorProps,
} from './types';

import React from 'react';

import GenericFacetEditor from './GenericFacetEditor';

export function createFacetKindEditor<Def extends FacetDefinition>(
	facetDefinition: Def,
	options: FacetEditorCreationOptions<Def>,
): FacetEditorComponent<Def> {
	return (props: SpecificFacetEditorProps<Def>) => {
		return <GenericFacetEditor {...options} {...props} facetDefinition={facetDefinition} />;
	};
}
