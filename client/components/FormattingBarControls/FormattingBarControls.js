import React from 'react';
import PropTypes from 'prop-types';
import FormattingBarControlsImage from 'components/FormattingBarControls/FormattingBarControlsImage';
import FormattingBarControlsVideo from 'components/FormattingBarControls/FormattingBarControlsVideo';
import FormattingBarControlsAudio from 'components/FormattingBarControls/FormattingBarControlsAudio';
import FormattingBarControlsIframe from 'components/FormattingBarControls/FormattingBarControlsIframe';
import FormattingBarControlsCitation from 'components/FormattingBarControls/FormattingBarControlsCitation';
import FormattingBarControlsFootnote from 'components/FormattingBarControls/FormattingBarControlsFootnote';
import FormattingBarControlsTable from 'components/FormattingBarControls/FormattingBarControlsTable';
import FormattingBarControlsEquation from 'components/FormattingBarControls/FormattingBarControlsEquation';
import FormattingBarControlsDiscussion from 'components/FormattingBarControls/FormattingBarControlsDiscussion';

require('./formattingBarControls.scss');

const propTypes = {
	editorChangeObject: PropTypes.object.isRequired,
	threads: PropTypes.array.isRequired,
	isSmall: PropTypes.bool.isRequired,
};

const FormattingBarControls = (props) => {
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
	};

	if (nodeType === 'image') {
		return <FormattingBarControlsImage {...controlsProps} />;
	}
	if (nodeType === 'video') {
		return <FormattingBarControlsVideo {...controlsProps} />;
	}
	if (nodeType === 'audio') {
		return <FormattingBarControlsAudio {...controlsProps} />;
	}
	if (nodeType === 'iframe') {
		return <FormattingBarControlsIframe {...controlsProps} />;
	}
	if (nodeType === 'citation') {
		return <FormattingBarControlsCitation {...controlsProps} />;
	}
	if (nodeType === 'footnote') {
		return <FormattingBarControlsFootnote {...controlsProps} />;
	}
	if (nodeType === 'table') {
		return <FormattingBarControlsTable {...controlsProps} />;
	}
	if (nodeType === 'equation' || nodeType === 'block_equation') {
		return <FormattingBarControlsEquation {...controlsProps} />;
	}
	if (nodeType === 'discussion') {
		return <FormattingBarControlsDiscussion {...controlsProps} />;
	}
	return null;
};

FormattingBarControls.propTypes = propTypes;
export default FormattingBarControls;
