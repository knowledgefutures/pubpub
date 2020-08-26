import React from 'react';

import { SimpleEditor } from 'components';
import { ControlsButton, ControlsButtonGroup } from '../ControlsButton';

import AlignmentControl from './AlignmentControl';
import SliderInputControl from './SliderInputControl';
import SourceControls from './SourceControls';

type Props = {
	isSmall: boolean;
	pendingAttrs: any;
	editorChangeObject: {
		updateNode: (...args: any[]) => any;
		selectedNode: {
			attrs?: {
				size?: number;
				align?: string;
				height?: number;
				caption?: string;
			};
		};
	};
};

const getCanEditNodeHeight = (selectedNode) => selectedNode.type.name === 'iframe';

const getItemName = (selectedNode) => {
	const { name } = selectedNode.type;
	if (name === 'iframe') {
		return 'item';
	}
	return name;
};

const ControlsMedia = (props: Props) => {
	const { isSmall, editorChangeObject, pendingAttrs } = props;
	const { updateNode, selectedNode } = editorChangeObject;
	const { hasPendingChanges, commitChanges, updateAttrs } = pendingAttrs;
	// @ts-expect-error ts-migrate(2339) FIXME: Property 'size' does not exist on type '{ size?: n... Remove this comment to see the full error message
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
					// @ts-expect-error ts-migrate(2741) FIXME: Property 'type' is missing in type '{ attrs?: { si... Remove this comment to see the full error message
					selectedNode={selectedNode}
					updateNode={updateNode}
					isSmall={isSmall}
				/>
			</div>
			<div className="section hide-overflow">
				<SimpleEditor
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'undefined... Remove this comment to see the full error message
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
export default ControlsMedia;
