import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import classNames from 'classnames';

import { ReferencesDropdown } from 'components';
import { getReferenceableNodes, NodeReference } from 'components/Editor/utils/references';
import { EditorChangeObject } from 'client/types';
import { usePubContext, usePubData } from 'client/containers/Pub/pubHooks';
import { getDashUrl } from 'utils/dashboard';

require('./controlsReference.scss');

export type ControlsReferenceProps = {
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
	const { pubData } = usePubContext();
	const nodeReferences = useMemo(
		() => (pubData.nodeLabels ? getReferenceableNodes(view.state, pubData.nodeLabels) : []),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[view.state],
	);
	const [target, setTarget] = useState(() => matchInitialTarget(selectedNode, nodeReferences));
	const targetId = target && target.node && target.node.attrs.id;
	const changed = useRef(false);

	useEffect(() => {
		if (changed.current) {
			updateNode({ targetId });
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
			references={nodeReferences}
			selectedReference={target}
			onSelect={onSelect}
		/>
	);
};

type ControlsReferencePopoverContentProps = {
	pubData: any;
	small?: boolean;
	dark?: boolean;
};

export const ControlsReferenceSettingsLink = (props: ControlsReferencePopoverContentProps) => {
	const link = (
		<a
			href={getDashUrl({
				pubSlug: props.pubData.slug,
				mode: 'settings',
				section: 'block-labels',
			})}
		>
			Pub Settings
		</a>
	);

	return (
		<span className={classNames('controls-reference-settings-link', props.dark && 'dark')}>
			{props.small ? (
				<>Enable item labeling in {link}</>
			) : (
				<>Visit {link} to turn on labeling and enable references.</>
			)}
		</span>
	);
};

export const ControlsReferencePopover = () => {
	const pubData = usePubData();

	return (
		<p className="controls-reference-popover-component">
			<ControlsReferenceSettingsLink pubData={pubData} />
		</p>
	);
};

export default ControlsReference;
