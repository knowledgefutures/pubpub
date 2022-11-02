import { PubEdgeDisplay } from 'facets';

import { createFacetEditor } from '../../createFacetEditor';
import { radio } from '../../propTypeEditors';

const DefaultsToCarouselSelector = radio({
	items: [
		{ value: true, label: 'Show Pub Connections as carousel' },
		{ value: false, label: 'Show Pub Connections as list' },
	],
});

const DescriptionIsVisibleSelector = radio({
	items: [
		{ value: true, label: 'Show descriptions' },
		{ value: false, label: 'Hide descriptions' },
	],
});

export default createFacetEditor(PubEdgeDisplay, {
	propEditors: {
		defaultsToCarousel: DefaultsToCarouselSelector,
		descriptionIsVisible: DescriptionIsVisibleSelector,
	},
});
