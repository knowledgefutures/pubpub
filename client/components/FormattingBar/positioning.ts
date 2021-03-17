import { EditorChangeObject } from '../Editor';

const getPositionForBounds = (getBoundsFn) => (
	changeObject: EditorChangeObject,
	container: HTMLElement,
) => {
	const wrapperBounds = container.offsetParent?.getBoundingClientRect();
	const bounds = getBoundsFn(changeObject);
	return {
		top: bounds.bottom - (wrapperBounds?.top ?? 0),
		left: bounds.left - (wrapperBounds?.left ?? 0),
	};
};

export const positionNearLink = getPositionForBounds(
	(changeObject: EditorChangeObject) => changeObject.activeLink!.boundingBox,
);

export const positionNearSelection = getPositionForBounds(
	(changeObject: EditorChangeObject) => changeObject.selectionBoundingBox,
);
