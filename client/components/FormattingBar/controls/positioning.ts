import React from 'react';
import { NodeSelection } from 'prosemirror-state';

import { getRangeBoundingBox } from 'components/Editor/plugins/onChange';
import { EditorChangeObject } from '../../Editor';

import { GetBoundsFn, ControlsConfiguration } from '../types';

const createFloatingPositionGetter =
	(getBounds: GetBoundsFn) =>
	(
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

const getCodeBlockParent = (editorChangeObject: EditorChangeObject) => {
	const state = editorChangeObject.view.state;
	const { $anchor } = state.selection;
	const parentSelection = NodeSelection.create(
		state.doc,
		state.selection.$anchor.before($anchor.depth),
	);
	return getRangeBoundingBox(editorChangeObject.view, parentSelection.from, parentSelection.to);
};

export const positionNearParent = createFloatingPositionGetter((changeObject: EditorChangeObject) =>
	getCodeBlockParent(changeObject),
);

export const positionNearLink = createFloatingPositionGetter(
	(changeObject: EditorChangeObject) => changeObject.activeLink!.boundingBox,
);

export const positionNearSelection = createFloatingPositionGetter(
	(changeObject: EditorChangeObject) => changeObject.selectionBoundingBox,
);
