import React from 'react';

import { FacetDefinition } from 'facets';

import GenericFacetEditor from './GenericFacetEditor';
import {
	FacetEditorComponent,
	FacetEditorCreationOptions,
	SpecificFacetEditorProps,
} from './types';

export function createFacetKindEditor<Def extends FacetDefinition>(
	facetDefinition: Def,
	options: FacetEditorCreationOptions<Def>,
): FacetEditorComponent<Def> {
	return (props: SpecificFacetEditorProps<Def>) => {
		return <GenericFacetEditor {...options} {...props} facetDefinition={facetDefinition} />;
	};
}
