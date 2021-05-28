import React from 'react';

import { EditorChangeObject } from '../../Editor';

import { GetBoundsFn, ControlsConfiguration } from '../types';

const createFloatingPositionGetter = (getBounds: GetBoundsFn) => (
	editorChangeObject: EditorChangeObject,
	config: ControlsConfiguration,
): React.CSSProperties => {
	const { container, isAbsolutelyPositioned } = config;
	const { left, bottom } = getBounds(editorChangeObject);
	const { top: containerTop, left: containerLeft } = container.getBoundingClientRect();
	const translateX = left - containerLeft;
	const translateY = bottom - containerTop;
	const transform = `translateX(${translateX}px) translateY(${translateY}px)`;
	if (isAbsolutelyPositioned) {
		return {
			position: 'absolute',
			transform,
			top: 0,
			left: 0,
		};
	}
	return { transform };
};

export const positionNearLink = createFloatingPositionGetter(
	(changeObject: EditorChangeObject) => changeObject.activeLink!.boundingBox,
);

export const positionNearSelection = createFloatingPositionGetter(
	(changeObject: EditorChangeObject) => changeObject.selectionBoundingBox,
);
