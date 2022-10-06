import React from 'react';

import { FacetName } from 'facets';
import { FacetEditor } from 'components';

const facetsInOrder: FacetName[] = [
	'License',
	'CitationStyle',
	'PubHeaderTheme',
	'NodeLabels',
	'PubEdgeDisplay',
];

const CommunityPubSettings = () => {
	return (
		<>
			{facetsInOrder.map((facetName) => (
				<FacetEditor facetName={facetName} />
			))}
		</>
	);
};

export default CommunityPubSettings;
