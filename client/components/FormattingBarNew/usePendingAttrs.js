import { useState } from 'react';

const attrsHaveChanges = (oldAttrs, newAttrs) => {
	return Object.keys(newAttrs).some((key) => newAttrs[key] !== oldAttrs[key]);
};

export const usePendingAttrs = ({ selectedNode, updateNode }) => {
	const [attrs, setAttrs] = useState({});

	if (!selectedNode) {
		return null;
	}

	const hasPendingChanges = attrsHaveChanges(selectedNode.attrs, attrs);

	const commitChanges = () => {
		updateNode(attrs);
	};

	const updateAttrs = (nextAttrs) => {
		setAttrs((prevAttrs) => ({ ...prevAttrs, ...nextAttrs }));
	};

	return {
		commitChanges: commitChanges,
		hasPendingChanges: hasPendingChanges,
		attrs: attrs,
		updateAttrs: updateAttrs,
	};
};
