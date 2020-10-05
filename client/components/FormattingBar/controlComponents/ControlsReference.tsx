import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';

import { ReferencesDropdown } from 'components';
import { getReferenceableNodes, NodeReference } from 'components/Editor/utils/references';
import { EditorChangeObject } from 'client/types';
import { usePubContext } from 'client/containers/Pub/pubHooks';

export type ControlsReferenceProps = {
	blockNames: { [key: string]: string };
	editorChangeObject: EditorChangeObject;
};

const matchInitialTarget = (selectedNode, referenceableNodes: NodeReference[]) => {
	if (selectedNode && selectedNode.attrs && selectedNode.attrs.targetId) {
		return referenceableNodes.find((rn) => rn.node.attrs.id === selectedNode.attrs.targetId);
	}
	return null;
};

const ControlsReference = (props: ControlsReferenceProps) => {
	const {
		editorChangeObject: { updateNode, selectedNode, view },
	} = props;
	const { blockNames } = usePubContext();
	const possibleTargets = useMemo(() => getReferenceableNodes(view.state), [view.state]);
	const [target, setTarget] = useState(() => matchInitialTarget(selectedNode, possibleTargets));
	const targetId = target && target.node && target.node.attrs.id;
	const changed = useRef(false);

	useEffect(() => {
		if (changed.current) {
			updateNode({ targetId: targetId });
			changed.current = false;
		}
	}, [targetId, updateNode]);

	const onSelect = useCallback(
		(reference: NodeReference) => {
			changed.current = true;
			setTarget(reference);
		},
		[setTarget],
	);

	return (
		<ReferencesDropdown
			references={possibleTargets}
			selectedReference={target}
			blockNames={blockNames}
			onSelect={onSelect}
		/>
	);
};

export default ControlsReference;
