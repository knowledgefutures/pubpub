import React, { useCallback } from 'react';
import { Checkbox, Classes, Tab, Tabs } from '@blueprintjs/core';
import { Node } from 'prosemirror-model';

import { SimpleEditor } from 'components';

import { usePubData } from 'client/containers/Pub/pubHooks';
import { NodeLabelMap, ReferenceableNodeType } from 'client/components/Editor/types';
import { imageCanBeResized } from 'client/components/Editor';

import { ControlsButton, ControlsButtonGroup } from '../ControlsButton';
import AlignmentControl from './AlignmentControl';
import SliderInputControl from './SliderInputControl';
import SourceControls from './SourceControls';
import { ControlsReferenceSettingsLink } from '../ControlsReference';

type Props = {
	isSmall: boolean;
	pendingAttrs: any;
	editorChangeObject: {
		updateNode: (...args: any[]) => any;
		selectedNode: Node & {
			attrs?: {
				size: number;
				align: string;
				height: number;
				caption: string;
				hideLabel: boolean;
				fullResolution: boolean;
			};
		};
	};
	pubData: any;
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
	const { isSmall, editorChangeObject, pendingAttrs, pubData } = props;
	const { updateNode, selectedNode } = editorChangeObject;
	const {
		hasPendingChanges,
		commitChanges,
		updateAttrs,
		attrs: { altText },
	} = pendingAttrs;
	const { size, align, height, caption, url, fullResolution, hideLabel } = selectedNode.attrs;
	const nodeSupportsAltText = !!selectedNode.type.spec.attrs?.altText;
	const canEditHeight = getCanEditNodeHeight(selectedNode);
	const itemName = getItemName(selectedNode);
	const { nodeLabels } = usePubData();

	const canHideLabel =
		nodeLabels &&
		(nodeLabels as NodeLabelMap)[selectedNode.type.name as ReferenceableNodeType]?.enabled;
	const canSelectResizeOptions = imageCanBeResized(url);

	const toggleLabel = useCallback(
		(e: React.MouseEvent) => updateNode({ hideLabel: (e.target as HTMLInputElement).checked }),
		[updateNode],
	);

	const toggleResize = useCallback(
		(e: React.MouseEvent) =>
			updateNode({ fullResolution: (e.target as HTMLInputElement).checked }),
		[updateNode],
	);

	const renderUpdateButton = () => {
		return (
			<ControlsButtonGroup>
				<ControlsButton disabled={!hasPendingChanges} onClick={commitChanges}>
					Update
				</ControlsButton>
			</ControlsButtonGroup>
		);
	};

	const renderCaptionPanel = () => {
		return (
			<div className="section hide-overflow">
				<SimpleEditor
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'undefined... Remove this comment to see the full error message
					placeholder={`Add a caption for this ${itemName}`}
					initialHtmlString={caption}
					onChange={(htmlString) => updateAttrs({ caption: htmlString })}
				/>
				{renderUpdateButton()}
			</div>
		);
	};

	const renderAltTextPanel = () => {
		return (
			<div className="section hide-overflow">
				<p>
					Alt text provides information about an image's contents to screenreader users
					that may be too detailed to include in a caption. Avoid duplicating text between
					these fields. If an image is purely decorative, leave this field blank.
				</p>
				<textarea
					placeholder={`Add alt text for this ${itemName}`}
					value={altText}
					onChange={(evt) => updateAttrs({ altText: evt.target.value })}
				/>
				{renderUpdateButton()}
			</div>
		);
	};

	const renderCaptionAltSelector = () => {
		return (
			<Tabs id="media-controls-caption-alt" className={Classes.DARK}>
				<Tab id="caption" title="Caption" panel={renderCaptionPanel()} />
				<Tab id="alt" title="Alt text" panel={renderAltTextPanel()} />
			</Tabs>
		);
	};

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
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'ProsemirrorNode<any> & { attrs?: { size: num... Remove this comment to see the full error message
					selectedNode={selectedNode}
					updateNode={updateNode}
					isSmall={isSmall}
				/>
				<div className="controls-row">
					{canSelectResizeOptions && (
						<Checkbox
							onClick={toggleResize}
							alignIndicator="right"
							label="Always use full resolution"
							checked={fullResolution}
						/>
					)}
				</div>
				<div className="controls-row">
					<Checkbox
						disabled={!canHideLabel}
						onClick={toggleLabel}
						alignIndicator="right"
						label="Hide label"
						checked={hideLabel}
					>
						{!canHideLabel && (
							<>
								{' '}
								(
								<ControlsReferenceSettingsLink dark small pubData={pubData} />)
							</>
						)}
					</Checkbox>
				</div>
			</div>
			{nodeSupportsAltText ? renderCaptionAltSelector() : renderCaptionPanel()}
		</div>
	);
};
export default ControlsMedia;
