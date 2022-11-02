import React from 'react';

import { NodeLabels } from 'facets';

import { createFacetEditor } from '../../createFacetEditor';
import NodeLabelEditor from './NodeLabelEditor';

const description = (
	<>
		You can enable automatic numbering for different types of blocks, and choose the text that
		will be used to reference them within the Pub. By giving two types of blocks the same name,
		you can group them into one ordering list (i.e., if you want both images and videos to be
		"figures" and share the same numbering, give them both the label "Figure").
	</>
);

export default createFacetEditor(NodeLabels, {
	description,
	propEditors: {
		image: NodeLabelEditor,
		audio: NodeLabelEditor,
		video: NodeLabelEditor,
		table: NodeLabelEditor,
		math: NodeLabelEditor,
	},
});
