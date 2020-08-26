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
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
			nextAttrs[key] = attrs[key];
		});
		updateNode(nextAttrs);
		setPendingKeys([]);
	};

	const updateAttrs = (nextAttrs) => {
		Object.keys(nextAttrs).forEach((possiblyNewKey) => {
			const nextKeys = [];
			// @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'string' is not assignable to par... Remove this comment to see the full error message
			if (!pendingKeys.includes(possiblyNewKey)) {
				// @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'string' is not assignable to par... Remove this comment to see the full error message
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
