import { useState } from 'react';

const attrsHaveChanges = (oldAttrs, newAttrs, keys) => {
	return keys.some((key) => newAttrs[key] !== oldAttrs[key]);
};

export const usePendingAttrs = ({ selectedNode, updateNode }) => {
	const [attrs, setAttrs] = useState(selectedNode && selectedNode.attrs);
	const [pendingKeys, setPendingKeys] = useState<string[]>([]);

	if (!selectedNode) {
		return null;
	}

	const hasPendingChanges = attrsHaveChanges(selectedNode.attrs, attrs, pendingKeys);

	const commitChanges = () => {
		const nextAttrs = {};
		pendingKeys.forEach((key) => {
			nextAttrs[key] = attrs[key];
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
