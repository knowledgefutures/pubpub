import { useState, useEffect, useCallback } from 'react';
import { usePrevious } from 'react-use';
import { Node } from 'prosemirror-model';

import { EditorChangeObject, updateNodeAttrsById } from 'client/components/Editor';

type Attrs = Node['attrs'];
type AttrsById = Record<string, null | Attrs>;

type PendingAttrsState = {
	attrs: Attrs;
	hasPendingChanges: boolean;
	updateAttrs: (partial: Attrs) => unknown;
	commitChanges: () => unknown;
};

export const usePendingAttrs = (
	editorChangeObject: EditorChangeObject,
): null | PendingAttrsState => {
	const { selectedNode, updateNode, view } = editorChangeObject;
	const selectedNodeId = (selectedNode?.attrs.id as string) || null;
	const previousSelectedNodeId = usePrevious(selectedNodeId);
	const [pendingAttrsById, setPendingAttrsById] = useState<AttrsById>({});

	const removePendingAttrsById = useCallback((id: string) => {
		setPendingAttrsById((current: AttrsById) => {
			const next = { ...current };
			delete next[id];
			return next;
		});
	}, []);

	const updateAttrs = useCallback(
		(next: Attrs) => {
			if (selectedNodeId) {
				setPendingAttrsById((current: AttrsById) => {
					const pendingAttrsForSelectedNode = current[selectedNodeId];
					return {
						...current,
						[selectedNodeId]: {
							...pendingAttrsForSelectedNode,
							...next,
						},
					};
				});
			}
		},
		[selectedNodeId],
	);

	const commitChanges = useCallback(() => {
		if (selectedNodeId && updateNode) {
			const pendingAttrsForSelectedNode = pendingAttrsById[selectedNodeId];
			if (pendingAttrsForSelectedNode) {
				updateNode?.(pendingAttrsForSelectedNode);
				removePendingAttrsById(selectedNodeId);
			}
		}
	}, [selectedNodeId, updateNode, pendingAttrsById, removePendingAttrsById]);

	useEffect(() => {
		if (previousSelectedNodeId && previousSelectedNodeId !== selectedNodeId) {
			const pendingAttrsForDeselectedNode = pendingAttrsById[previousSelectedNodeId];
			if (pendingAttrsForDeselectedNode) {
				updateNodeAttrsById(view, previousSelectedNodeId, pendingAttrsForDeselectedNode);
				removePendingAttrsById(previousSelectedNodeId);
			}
		}
	}, [selectedNodeId, previousSelectedNodeId, pendingAttrsById, removePendingAttrsById, view]);

	if (selectedNode && selectedNodeId) {
		const pendingAttrsForSelectedNode = pendingAttrsById[selectedNodeId];
		const hasPendingChanges = pendingAttrsForSelectedNode
			? Object.keys(pendingAttrsForSelectedNode).length > 0
			: false;
		return {
			attrs: { ...selectedNode.attrs, ...pendingAttrsForSelectedNode },
			hasPendingChanges,
			updateAttrs,
			commitChanges,
		};
	}

	return null;
};
