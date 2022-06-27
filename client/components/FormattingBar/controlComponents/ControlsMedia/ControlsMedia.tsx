import React, { useCallback } from 'react';
import { Checkbox, Classes, Tab, Tabs } from '@blueprintjs/core';
import classNames from 'classnames';

import { SimpleEditor, SliderInput } from 'components';
import { NodeLabelMap, ReferenceableNodeType } from 'components/Editor/types';
import { getCurrentNodeLabels, isResizeableFormat } from 'components/Editor';

import { ControlsButton, ControlsButtonGroup } from '../ControlsButton';
import AlignmentControl from './AlignmentControl';
import UrlControl from './UrlControl';
import SourceControls from './SourceControls';
import { ControlsReferenceSettingsLink } from '../ControlsReference';
import { EditorChangeObjectWithNode } from '../../types';

require('./controlsMedia.scss');

type Props = {
	pendingAttrs: any;
	editorChangeObject: EditorChangeObjectWithNode;
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
	const { editorChangeObject, pendingAttrs } = props;
	const { selectedNode, updateNode } = editorChangeObject;
	const {
		hasPendingChanges,
		commitChanges,
		updateAttrs,
		attrs: { altText },
	} = pendingAttrs;
	const { size, align, href, height, caption, url, fullResolution, hideLabel } =
		selectedNode.attrs;
	const nodeSupportsAltText = !!selectedNode.type.spec.attrs?.altText;
	const canEditHeight = getCanEditNodeHeight(selectedNode);
	const itemName = getItemName(selectedNode);
	const nodeLabels = getCurrentNodeLabels(editorChangeObject.view.state);

	const canHideLabel =
		nodeLabels &&
		(nodeLabels as NodeLabelMap)[selectedNode.type.name as ReferenceableNodeType]?.enabled;
	const canSelectResizeOptions = isResizeableFormat(url);

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
			<div className="section">
				<SimpleEditor
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
			<div className="section">
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
			<Tabs
				id="media-controls-caption-alt"
				className={classNames(Classes.DARK, 'caption-alt-tabs')}
			>
				<Tab id="caption" title="Caption" panel={renderCaptionPanel()} />
				<Tab id="alt" title="Alt text" panel={renderAltTextPanel()} />
			</Tabs>
		);
	};

	return (
		<div className="controls-media-component">
			<div className="section">
				<SliderInput
					min={1}
					max={100}
					leftLabel="Width"
					rightLabel="%"
					aria-label="Figure width (percentage)"
					value={size}
					disabled={align === 'full'}
					onChange={(nextSize) => updateNode({ size: nextSize })}
				/>
				{canEditHeight && (
					<SliderInput
						min={150}
						max={800}
						aria-label="Figure height (pixels)"
						leftLabel="Height"
						rightLabel="px"
						value={height}
						disabled={false}
						onChange={(nextHeight) => updateNode({ height: nextHeight })}
					/>
				)}
				<AlignmentControl
					value={align}
					onChange={(nextAlignment) => updateNode({ align: nextAlignment })}
				/>
				<UrlControl onChange={(nextHref) => updateNode({ href: nextHref })} value={href} />
				<SourceControls selectedNode={selectedNode} updateNode={updateNode} />
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
				{canHideLabel && (
					<div className="controls-row">
						<Checkbox
							onClick={toggleLabel}
							alignIndicator="right"
							label="Hide label"
							checked={hideLabel}
						>
							{!canHideLabel && (
								<>
									{' '}
									(
									<ControlsReferenceSettingsLink dark small />)
								</>
							)}
						</Checkbox>
					</div>
				)}
			</div>
			{nodeSupportsAltText ? renderCaptionAltSelector() : renderCaptionPanel()}
		</div>
	);
};
export default ControlsMedia;
