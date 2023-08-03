import { ALL_FACET_DEFINITIONS } from 'facets';
import { FacetsActivityItem } from 'types';

import { TitleRenderer } from '../../../client/utils/activity/types';

export const facetTitle: TitleRenderer<FacetsActivityItem> = (item) => {
	const {
		payload: { facetName },
	} = item;
	const facetDefinition = ALL_FACET_DEFINITIONS[facetName];
	return { title: facetDefinition?.label ?? facetName };
};
