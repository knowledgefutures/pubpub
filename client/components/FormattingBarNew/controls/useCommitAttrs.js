import { useState, useEffect, useCallback } from 'react';

const noop = () => {};

const attrsHaveChanges = (oldAttrs, newAttrs) => {
	return Object.keys(newAttrs).some((key) => newAttrs[key] !== oldAttrs[key]);
};

export const useCommitAttrs = (baseAttrs, onCommit, onPendingChanges = noop) => {
	const [attrs, setAttrs] = useState(baseAttrs);
	const [revertKey, setRevertKey] = useState(Date.now());
	const hasPendingChanges = attrsHaveChanges(baseAttrs, attrs);

	const revertChanges = () => {
		setAttrs(baseAttrs);
		setRevertKey(Date.now());
	};

	const commitChanges = () => {
		onCommit(attrs);
	};

	const handleUpdateAttrs = (nextAttrs) => {
		setAttrs((prevAttrs) => ({ ...prevAttrs, ...nextAttrs }));
	};

	useEffect(() => onPendingChanges(hasPendingChanges), [hasPendingChanges, onPendingChanges]);

	return {
		commitChanges: commitChanges,
		revertKey: revertKey,
		hasPendingChanges: hasPendingChanges,
		pendingAttrs: attrs,
		updateAttrs: handleUpdateAttrs,
		revertChanges: revertChanges,
	};
};
