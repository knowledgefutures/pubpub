import React from 'react';
import PropTypes from 'prop-types';

import AlignmentControl from './AlignmentControl';
import SliderInputControl from './SliderInputControl';
import SourceControls from './SourceControls';

const getCanEditNodeHeight = (selectedNode) => selectedNode.type.name === 'iframe';

const ControlsMedia = (props) => {
	const { isSmall, editorChangeObject } = props;
	const { updateNode, selectedNode } = editorChangeObject;
	const { size, align, height } = selectedNode.attrs;
	const canEditHeight = getCanEditNodeHeight(selectedNode);
	return (
		<div className="controls-media-component">
			<div className="section">
				<SliderInputControl
					minValue={20}
					maxValue={100}
					leftLabel="Width"
					rightLabel="%"
					value={size}
					disabled={align === 'full'}
					onChange={(nextSize) => updateNode({ size: nextSize })}
				/>
				{canEditHeight && (
					<SliderInputControl
						minValue={150}
						maxValue={800}
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
		</div>
	);
};

ControlsMedia.propTypes = {
	isSmall: PropTypes.bool.isRequired,
	editorChangeObject: PropTypes.shape({
		updateNode: PropTypes.func.isRequired,
		selectedNode: PropTypes.shape({
			attrs: PropTypes.shape({
				size: PropTypes.number,
				align: PropTypes.string,
				height: PropTypes.number,
			}),
		}).isRequired,
	}).isRequired,
};

export default ControlsMedia;
