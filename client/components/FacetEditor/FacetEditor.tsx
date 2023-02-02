import React, { useCallback } from 'react';

import { FacetInstance, Facet, Facets } from 'facets';
import { useFacetsState } from 'client/utils/useFacets';

import {
	CitationStyleEditor,
	PubEdgeDisplayEditor,
	PubHeaderThemeEditor,
	NodeLabelsEditor,
	LicenseEditor,
} from './definitions';
import { FacetEditorComponent, SpecificFacetEditorProps } from './types';

type Props<Def extends Facet> = {
	facetName: Def['name'];
} & Omit<SpecificFacetEditorProps<Def>, 'currentScope' | 'cascadeResult' | 'onUpdateValue'>;

const editorsForFacets: Partial<{
	[K in keyof Facets]: FacetEditorComponent<Facets[K]>;
}> = {
	CitationStyle: CitationStyleEditor,
	PubEdgeDisplay: PubEdgeDisplayEditor,
	PubHeaderTheme: PubHeaderThemeEditor,
	NodeLabels: NodeLabelsEditor,
	License: LicenseEditor,
};

function FacetEditor<Def extends Facet>(props: Props<Def>) {
	const { facetName: name, selfContained, ...editorProps } = props;
	const Editor: undefined | FacetEditorComponent<any> = editorsForFacets[name];
	const { currentScope, facets, updateFacet, persistFacets } = useFacetsState();
	const { cascadeResult, isPersisting } = facets[name]!;

	const updateThisFacet = useCallback(
		(patch: Partial<FacetInstance<Def>>) => {
			updateFacet(name, patch);
			if (selfContained) {
				persistFacets();
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[name, updateFacet, persistFacets, selfContained],
	);

	if (Editor) {
		return (
			<Editor
				{...editorProps}
				selfContained={selfContained}
				onUpdateValue={updateThisFacet}
				cascadeResult={cascadeResult}
				currentScope={currentScope}
				isPersisting={isPersisting}
			/>
		);
	}

	return null;
}

export default FacetEditor;
