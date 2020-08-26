import React from 'react';
import ControlsImage from './ControlsImage';
import ControlsVideo from './ControlsVideo';
import ControlsAudio from './ControlsAudio';
import ControlsIframe from './ControlsIframe';
import ControlsCitation from './ControlsCitation';
import ControlsFootnote from './ControlsFootnote';
import ControlsTable from './ControlsTable';
import ControlsEquation from './ControlsEquation';
import ControlsDiscussion from './ControlsDiscussion';

require('./controls.scss');

type Props = {
	editorChangeObject: any;
	threads: any[];
	isSmall: boolean;
	footnotes: any[];
	citations: any[];
};

const Controls = (props: Props) => {
	const selectedNode = props.editorChangeObject.selectedNode || {};
	const attrs = selectedNode.attrs;
	const updateFunc = props.editorChangeObject.updateNode;
	const changeNodeFunc = props.editorChangeObject.changeNode;
	const nodeType = selectedNode.type ? selectedNode.type.name : 'table';
	const menuItems = props.editorChangeObject.menuItems || [];

	// ?Inline permalink
	const controlsProps = {
		attrs: attrs,
		updateAttrs: updateFunc,
		changeNode: changeNodeFunc,
		menuItems: menuItems,
		threads: props.threads,
		selectedNode: selectedNode,
		editorChangeObject: props.editorChangeObject,
		isSmall: props.isSmall,
		footnotes: props.footnotes,
		citations: props.citations,
	};

	if (nodeType === 'image') {
		return <ControlsImage {...controlsProps} />;
	}
	if (nodeType === 'video') {
		return <ControlsVideo {...controlsProps} />;
	}
	if (nodeType === 'audio') {
		return <ControlsAudio {...controlsProps} />;
	}
	if (nodeType === 'iframe') {
		return <ControlsIframe {...controlsProps} />;
	}
	if (nodeType === 'citation') {
		return <ControlsCitation {...controlsProps} />;
	}
	if (nodeType === 'footnote') {
		return <ControlsFootnote {...controlsProps} />;
	}
	if (nodeType === 'table') {
		return <ControlsTable {...controlsProps} />;
	}
	if (nodeType === 'equation' || nodeType === 'block_equation') {
		return <ControlsEquation {...controlsProps} />;
	}
	if (nodeType === 'discussion') {
		return <ControlsDiscussion {...controlsProps} />;
	}
	return null;
};
export default Controls;
