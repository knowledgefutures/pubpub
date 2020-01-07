import { useState, useEffect, useCallback } from 'react';

const noop = () => {};

const attrsHaveChanges = (oldAttrs, newAttrs) => {
	return Object.keys(newAttrs).some((key) => newAttrs[key] !== oldAttrs[key]);
};

export const usePendingAttrs = (baseAttrs, onCommit, onPendingChanges = noop) => {
	const [attrs, setAttrs] = useState(baseAttrs);
	const hasPendingChanges = attrsHaveChanges(baseAttrs, attrs);

	const commitChanges = useCallback(() => {
		onCommit(attrs);
	}, [attrs, onCommit]);

	const handleUpdateAttrs = (nextAttrs) => {
		setAttrs((prevAttrs) => ({ ...prevAttrs, ...nextAttrs }));
	};

	useEffect(() => onPendingChanges(hasPendingChanges), [hasPendingChanges, onPendingChanges]);

	return {
		commitChanges: commitChanges,
		hasPendingChanges: hasPendingChanges,
		attrs: attrs,
		updateAttrs: handleUpdateAttrs,
	};
};
