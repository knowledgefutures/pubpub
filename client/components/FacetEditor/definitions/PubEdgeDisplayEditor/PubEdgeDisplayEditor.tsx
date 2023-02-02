import { PubEdgeDisplay } from 'facets';

import { createFacetKindEditor } from '../../createFacetKindEditor';
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

export default createFacetKindEditor(PubEdgeDisplay, {
	propEditors: {
		defaultsToCarousel: DefaultsToCarouselSelector,
		descriptionIsVisible: DescriptionIsVisibleSelector,
	},
});
