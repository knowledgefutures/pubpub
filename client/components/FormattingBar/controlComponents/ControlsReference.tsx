import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import classNames from 'classnames';

import { ReferencesDropdown } from 'components';
import {
	getCurrentNodeLabels,
	getReferenceableNodes,
	NodeReference,
} from 'components/Editor/utils/references';
import { usePubContext } from 'client/containers/Pub/pubHooks';

import { getDashUrl } from 'utils/dashboard';
import { EditorChangeObjectWithNode } from '../types';

require('./controlsReference.scss');

export type ControlsReferenceProps = {
	editorChangeObject: EditorChangeObjectWithNode;
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

	const nodeLabels = getCurrentNodeLabels(view.state);
	const nodeReferences = useMemo(
		() => (nodeLabels ? getReferenceableNodes(view.state, nodeLabels) : []),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[view.state, nodeLabels],
	);

	const [target, setTarget] = useState(() => matchInitialTarget(selectedNode, nodeReferences));
	const targetId = target && target.node && target.node.attrs.id;
	const changed = useRef(false);

	useEffect(() => {
		if (changed.current) {
			updateNode!({ targetId });
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
	small?: boolean;
	dark?: boolean;
};

export const ControlsReferenceSettingsLink = (props: ControlsReferencePopoverContentProps) => {
	const { inPub, pubData } = usePubContext();

	if (!inPub) {
		return null;
	}

	const link = (
		<a
			href={getDashUrl({
				pubSlug: pubData.slug,
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
	const { inPub } = usePubContext();

	if (!inPub) {
		return null;
	}

	return (
		<p className="controls-reference-popover-component">
			<ControlsReferenceSettingsLink />
		</p>
	);
};

export default ControlsReference;
