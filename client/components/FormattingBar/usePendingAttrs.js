import { useState } from 'react';

const attrsHaveChanges = (oldAttrs, newAttrs, keys) => {
	return keys.some((key) => newAttrs[key] !== oldAttrs[key]);
};

export const usePendingAttrs = ({ selectedNode, updateNode }) => {
	const [attrs, setAttrs] = useState(selectedNode && selectedNode.attrs);
	const [pendingKeys, setPendingKeys] = useState([]);

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
		Object.keys(nextAttrs).forEach((possiblyNewKey) => {
			const nextKeys = [];
			if (!pendingKeys.includes(possiblyNewKey)) {
				nextKeys.push(possiblyNewKey);
			}
			if (nextKeys.length > 0) {
				setPendingKeys([...pendingKeys, ...nextKeys]);
			}
		});
		setAttrs((prevAttrs) => ({ ...prevAttrs, ...nextAttrs }));
	};

	return {
		commitChanges: commitChanges,
		hasPendingChanges: hasPendingChanges,
		attrs: attrs,
		updateAttrs: updateAttrs,
	};
};
