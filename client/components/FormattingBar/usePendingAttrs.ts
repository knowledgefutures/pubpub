import { Node } from 'prosemirror-model';
import { useEffect, useState } from 'react';
import { usePrevious } from 'react-use';

type Attrs = Node['attrs'];

const attrsHaveChanges = (oldAttrs: null | Attrs, newAttrs: null | Attrs, keys: string[]) => {
	if (!oldAttrs || !newAttrs) {
		return false;
	}
	return keys.some((key) => newAttrs[key] !== oldAttrs[key]);
};

export const usePendingAttrs = ({
	selectedNode,
	updateNode,
}: {
	selectedNode?: Node;
	updateNode: (attrs: Attrs) => unknown;
}) => {
	const [attrs, setAttrs] = useState(selectedNode?.attrs ?? null);
	const selectedNodeId = selectedNode?.attrs.id;
	const [pendingKeys, setPendingKeys] = useState<string[]>([]);
	const previousSelectedNode = usePrevious(selectedNode);

	useEffect(() => {
		if (selectedNode) {
			setAttrs(selectedNode.attrs);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedNodeId]);

	useEffect(() => {
		if (previousSelectedNode) {
			console.log('had', previousSelectedNode.attrs);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [previousSelectedNode?.attrs?.id]);

	if (!selectedNode) {
		return null;
	}

	const hasPendingChanges = attrsHaveChanges(selectedNode.attrs, attrs, pendingKeys);

	const commitChanges = () => {
		const nextAttrs = {};
		pendingKeys.forEach((key) => {
			nextAttrs[key] = attrs?.[key];
		});
		updateNode(nextAttrs);
		setPendingKeys([]);
	};

	const updateAttrs = (nextAttrs) => {
		setPendingKeys((prevPendingKeys) => [
			...new Set([...prevPendingKeys, ...Object.keys(nextAttrs)]),
		]);
		setAttrs((prevAttrs) => ({ ...prevAttrs, ...nextAttrs }));
	};

	return {
		commitChanges: commitChanges,
		hasPendingChanges: hasPendingChanges,
		attrs: attrs,
		updateAttrs: updateAttrs,
	};
};
