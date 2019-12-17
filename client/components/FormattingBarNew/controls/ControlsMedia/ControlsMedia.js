import React from 'react';
import PropTypes from 'prop-types';

import { SimpleEditor } from 'components';
import { ControlsButton, ControlsButtonGroup } from '../ControlsButton';
import { useCommitAttrs } from '../useCommitAttrs';

import AlignmentControl from './AlignmentControl';
import SliderInputControl from './SliderInputControl';
import SourceControls from './SourceControls';

const getCanEditNodeHeight = (selectedNode) => selectedNode.type.name === 'iframe';

const getItemName = (selectedNode) => {
	const { name } = selectedNode.type;
	if (name === 'iframe') {
		return 'item';
	}
	return name;
};

const ControlsMedia = (props) => {
	const { isSmall, editorChangeObject, onPendingChanges } = props;
	const { updateNode, selectedNode } = editorChangeObject;
	const { size, align, height, caption } = selectedNode.attrs;
	const {
		hasPendingChanges,
		commitChanges,
		revertChanges,
		commitKey,
		updateAttrs,
	} = useCommitAttrs({ caption: caption }, updateNode, onPendingChanges);
	const canEditHeight = getCanEditNodeHeight(selectedNode);
	const itemName = getItemName(selectedNode);
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
			<div className="section hide-overflow">
				<SimpleEditor
					key={commitKey}
					placeholder={`Add a caption for this ${itemName}`}
					initialHtmlString={caption}
					onChange={(htmlString) => updateAttrs({ caption: htmlString })}
				/>
				<ControlsButtonGroup>
					<ControlsButton disabled={!hasPendingChanges} onClick={revertChanges}>
						Revert
					</ControlsButton>
					<ControlsButton disabled={!hasPendingChanges} onClick={commitChanges}>
						Update caption
					</ControlsButton>
				</ControlsButtonGroup>
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
				caption: PropTypes.string,
			}),
		}).isRequired,
	}).isRequired,
	onPendingChanges: PropTypes.func.isRequired,
};

export default ControlsMedia;
