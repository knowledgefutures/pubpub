const getPositionForBounds = (getBoundsFn) => (changeObject, containerRef) => {
	const wrapperBounds = containerRef.current.offsetParent.getBoundingClientRect();
	const bounds = getBoundsFn(changeObject);
	return {
		top: bounds.bottom - wrapperBounds.top,
		left: bounds.left - wrapperBounds.left,
	};
};

export const positionNearLink = getPositionForBounds(
	(changeObject) => changeObject.activeLink.boundingBox,
);

export const positionNearSelection = getPositionForBounds(
	(changeObject) => changeObject.selectionBoundingBox,
);
