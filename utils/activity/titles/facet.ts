import type { FacetsActivityItem } from 'types';

import type { TitleRenderer } from '../../../client/utils/activity/types';

import { ALL_FACET_DEFINITIONS } from 'facets';

export const facetTitle: TitleRenderer<FacetsActivityItem> = (item) => {
	const {
		payload: { facetName },
	} = item;
	const facetDefinition = ALL_FACET_DEFINITIONS[facetName];
	return { title: facetDefinition?.label ?? facetName };
};
