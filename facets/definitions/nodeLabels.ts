import { z } from 'zod';

import { propType, prop, facet } from '../core';

const nodeLabel = propType({
	name: 'nodeLabel',
	schema: z.object({ enabled: z.boolean(), text: z.string() }),
	postgresType: 'jsonb',
});

export const NodeLabels = facet({
	name: 'NodeLabels',
	label: 'Item labels',
	props: {
		image: prop(nodeLabel, {
			label: 'Images',
			rootValue: { enabled: false, text: 'Image' },
		}),
		video: prop(nodeLabel, {
			label: 'Videos',
			rootValue: { enabled: false, text: 'Video' },
		}),
		audio: prop(nodeLabel, {
			label: 'Audio',
			rootValue: { enabled: false, text: 'Audio' },
		}),
		table: prop(nodeLabel, {
			label: 'Tables',
			rootValue: { enabled: false, text: 'Table' },
		}),
		math: prop(nodeLabel, {
			label: 'Math',
			rootValue: { enabled: false, text: 'Equation' },
		}),
	},
});
