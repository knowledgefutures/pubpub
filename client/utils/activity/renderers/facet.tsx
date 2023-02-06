import React from 'react';

import { FacetsActivityItem } from 'types';
import { pubPubIcons } from 'client/utils/icons';

import { facetTitle, scopeTitle } from '../titles';
import { itemRenderer } from './itemRenderer';

type Titles = 'scope' | 'facet';

export const renderFacetInstanceUpdated = itemRenderer<FacetsActivityItem, Titles>({
	icon: ({ context }) => {
		if ('pubId' in context.scope) {
			return pubPubIcons.pub;
		}
		if ('collectionId' in context.scope) {
			return pubPubIcons.collection;
		}
		return pubPubIcons.community;
	},
	titleRenderers: {
		scope: scopeTitle,
		facet: facetTitle,
	},
	message: ({ titles }) => {
		const { actor, scope, facet } = titles;
		return (
			<>
				{actor} updated the {facet} for {scope}
			</>
		);
	},
});
