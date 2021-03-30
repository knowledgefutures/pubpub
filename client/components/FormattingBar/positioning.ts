import { EditorChangeObject } from '../Editor';

const getPositionForBounds = (getBoundsFn) => (
	changeObject: EditorChangeObject,
	container?: HTMLElement,
) => {
	const wrapperBounds = container?.getBoundingClientRect();
	const { left, bottom } = getBoundsFn(changeObject);
	const wrapperTop = wrapperBounds?.top ?? 0;
	const wrapperLeft = wrapperBounds?.left ?? 0;
	const translateX = left - wrapperLeft;
	const translateY = bottom - wrapperTop;
	return { transform: `translateX(${translateX}px) translateY(${translateY}px)` };
};

export const positionNearLink = getPositionForBounds(
	(changeObject: EditorChangeObject) => changeObject.activeLink!.boundingBox,
);

export const positionNearSelection = getPositionForBounds(
	(changeObject: EditorChangeObject) => changeObject.selectionBoundingBox,
);
