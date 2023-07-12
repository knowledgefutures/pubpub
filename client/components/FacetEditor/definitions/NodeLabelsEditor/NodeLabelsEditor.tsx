import React from 'react';

import { NodeLabels } from 'facets';

import { createFacetKindEditor } from '../../createFacetKindEditor';
import NodeLabelEditor from './NodeLabelEditor';

const description = (
	<>
		You can enable automatic numbering for different types of blocks, and choose the text that
		will be used to reference them within the Pub. By giving two types of blocks the same name,
		you can group them into one ordering list (i.e., if you want both images and videos to be
		"figures" and share the same numbering, give them both the label "Figure").
	</>
);

export default createFacetKindEditor(NodeLabels, {
	description,
	propEditors: {
		// @ts-expect-error FIXME: NodeLabelEditor has `FacetPropEditorProps<..., Nullable=false>`, while propEditors[string] expects nullable `true`
		image: NodeLabelEditor,
		// @ts-expect-error FIXME: NodeLabelEditor has `FacetPropEditorProps<..., Nullable=false>`, while propEditors[string] expects nullable `true`
		audio: NodeLabelEditor,
		// @ts-expect-error FIXME: NodeLabelEditor has `FacetPropEditorProps<..., Nullable=false>`, while propEditors[string] expects nullable `true`
		video: NodeLabelEditor,
		// @ts-expect-error FIXME: NodeLabelEditor has `FacetPropEditorProps<..., Nullable=false>`, while propEditors[string] expects nullable `true`
		table: NodeLabelEditor,
		// @ts-expect-error FIXME: NodeLabelEditor has `FacetPropEditorProps<..., Nullable=false>`, while propEditors[string] expects nullable `true`
		math: NodeLabelEditor,
	},
});
