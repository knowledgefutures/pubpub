import React, { useEffect, useState, useMemo, useRef } from 'react';

import { MenuButton, MenuItem } from 'components/Menu';
import { getReferenceableNodes } from 'components/Editor/utils/references';
import { EditorChangeObject } from 'client/types';

export type ControlsReferenceProps = {
	editorChangeObject: EditorChangeObject;
};

const matchInitialTarget = (selectedNode, referenceableNodes) => {
	if (selectedNode && selectedNode.attrs && selectedNode.attrs.targetId) {
		return referenceableNodes.find((rn) => rn.node.attrs.id === selectedNode.attrs.targetId);
	}
	return null;
};

const ControlsReference = (props: ControlsReferenceProps) => {
	const {
		editorChangeObject: { updateNode, selectedNode, view },
	} = props;

	const possibleTargets = useMemo(() => getReferenceableNodes(view.state), [view.state]);
	const [target, setTarget] = useState(() => matchInitialTarget(selectedNode, possibleTargets));
	const targetId = target && target.node && target.node.attrs.id;
	const changed = useRef(false);

	const currentIcon = target ? target.referenceType.bpDisplayIcon : 'disable';
	const currentLabel = target
		? target.label
		: possibleTargets.length
		? 'No referenced item'
		: 'No items to reference';

	useEffect(() => {
		if (changed.current) {
			updateNode({ targetId: targetId });
			changed.current = false;
		}
	}, [targetId, updateNode]);

	return (
		<div className="controls-link-component">
			<MenuButton
				disabled={possibleTargets.length === 0}
				aria-label="Select an item to reference"
				buttonContent={currentLabel}
				buttonProps={{
					rightIcon: 'chevron-down',
					minimal: true,
					icon: currentIcon,
				}}
			>
				{possibleTargets.map((possibleTarget) => {
					const { label, referenceType, node } = possibleTarget;
					return (
						<MenuItem
							onClick={() => {
								changed.current = true;
								setTarget(possibleTarget);
							}}
							key={node.attrs.id}
							active={targetId && targetId === node.attrs.id}
							text={label}
							icon={referenceType.bpDisplayIcon}
						/>
					);
				})}
			</MenuButton>
		</div>
	);
};

export default ControlsReference;
