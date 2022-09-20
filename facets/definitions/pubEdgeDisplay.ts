import { facet, prop, boolean } from '../core';

export const PubEdgeDisplay = facet({
	name: 'PubEdgeDisplay',
	label: 'Pub Connections settings',
	props: {
		defaultsToCarousel: prop(boolean, {
			rootValue: true,
			label: 'Appearance in Pub',
		}),
		descriptionIsVisible: prop(boolean, {
			rootValue: true,
			label: 'Show Connection descriptions',
		}),
	},
});
