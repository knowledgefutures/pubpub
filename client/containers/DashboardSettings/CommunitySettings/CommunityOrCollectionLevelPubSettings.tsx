import type { FacetName } from 'facets';

import React from 'react';

import { FacetEditor } from 'components';

const facetsInOrder: FacetName[] = [
	'License',
	'CitationStyle',
	'PubHeaderTheme',
	'NodeLabels',
	'PubEdgeDisplay',
];

const CommunityOrCollectionLevelPubSettings = () => {
	return (
		<>
			{facetsInOrder.map((facetName) => (
				<FacetEditor facetName={facetName} />
			))}
		</>
	);
};

export default CommunityOrCollectionLevelPubSettings;
