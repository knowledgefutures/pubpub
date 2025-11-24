import { z } from 'zod';

import { facet, prop, propType } from '../core';

const nodeLabel = propType({
	name: 'nodeLabel',
	schema: z.object({ enabled: z.boolean(), text: z.string() }),
	postgresType: 'jsonb',
});

const image = prop(nodeLabel, {
	label: 'Images',
	rootValue: { enabled: false, text: 'Image' },
});

const video = prop(nodeLabel, {
	label: 'Videos',
	rootValue: { enabled: false, text: 'Video' },
});

const audio = prop(nodeLabel, {
	label: 'Audio',
	rootValue: { enabled: false, text: 'Audio' },
});

const table = prop(nodeLabel, {
	label: 'Tables',
	rootValue: { enabled: false, text: 'Table' },
});

const math = prop(nodeLabel, {
	label: 'Math',
	rootValue: { enabled: false, text: 'Equation' },
});

const iframe = prop(nodeLabel, {
	label: 'Iframe',
	rootValue: { enabled: false, text: 'Iframe' },
});

export const NodeLabels = facet({
	name: 'NodeLabels',
	label: 'Item labels',
	props: {
		image,
		video,
		audio,
		table,
		math,
		iframe,
	},
});
