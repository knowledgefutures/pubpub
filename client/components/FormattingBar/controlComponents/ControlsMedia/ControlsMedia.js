import React from 'react';
import PropTypes from 'prop-types';

import { SimpleEditor } from 'components';
import { ControlsButton, ControlsButtonGroup } from '../ControlsButton';

import AlignmentControl from './AlignmentControl';
import SliderInputControl from './SliderInputControl';
import SourceControls from './SourceControls';

const propTypes = {
	isSmall: PropTypes.bool.isRequired,
	pendingAttrs: PropTypes.object.isRequired,
	editorChangeObject: PropTypes.shape({
		updateNode: PropTypes.func.isRequired,
		selectedNode: PropTypes.shape({
			attrs: PropTypes.shape({
				size: PropTypes.number,
				align: PropTypes.string,
				height: PropTypes.number,
				caption: PropTypes.string,
			}),
		}).isRequired,
	}).isRequired,
};

const getCanEditNodeHeight = (selectedNode) => selectedNode.type.name === 'iframe';

const getItemName = (selectedNode) => {
	const { name } = selectedNode.type;
	if (name === 'iframe') {
		return 'item';
	}
	return name;
};

const ControlsMedia = (props) => {
	const { isSmall, editorChangeObject, pendingAttrs } = props;
	const { updateNode, selectedNode } = editorChangeObject;
	const { hasPendingChanges, commitChanges, updateAttrs } = pendingAttrs;
	const { size, align, height, caption } = selectedNode.attrs;
	const canEditHeight = getCanEditNodeHeight(selectedNode);
	const itemName = getItemName(selectedNode);

	return (
		<div className="controls-media-component">
			<div className="section">
				<SliderInputControl
					minValue={1}
					maxValue={100}
					leftLabel="Width"
					rightLabel="%"
					aria-label="Figure width (percentage)"
					value={size}
					disabled={align === 'full'}
					onChange={(nextSize) => updateNode({ size: nextSize })}
				/>
				{canEditHeight && (
					<SliderInputControl
						minValue={150}
						maxValue={800}
						aria-label="Figure height (pixels)"
						leftLabel="Height"
						rightLabel="px"
						value={height}
						disabled={false}
						onChange={(nextHeight) => updateNode({ height: nextHeight })}
					/>
				)}
				<AlignmentControl
					isSmall={isSmall}
					value={align}
					onChange={(nextAlignment) => updateNode({ align: nextAlignment })}
				/>
				<SourceControls
					selectedNode={selectedNode}
					updateNode={updateNode}
					isSmall={isSmall}
				/>
			</div>
			<div className="section hide-overflow">
				<SimpleEditor
					placeholder={`Add a caption for this ${itemName}`}
					initialHtmlString={caption}
					onChange={(htmlString) => updateAttrs({ caption: htmlString })}
				/>
				<ControlsButtonGroup>
					<ControlsButton disabled={!hasPendingChanges} onClick={commitChanges}>
						Update caption
					</ControlsButton>
				</ControlsButtonGroup>
			</div>
		</div>
	);
};

ControlsMedia.propTypes = propTypes;
export default ControlsMedia;
