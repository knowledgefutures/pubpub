import { Selection, NodeSelection } from 'prosemirror-state';

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

export const setEditorSelectionFromClick = (editorChangeObject, clickEvent) => {
	const { view } = editorChangeObject;
	const { clientX, clientY } = clickEvent;
	const posAtCoords = view.posAtCoords({ left: clientX, top: clientY });
	if (posAtCoords) {
		const { pos, inside } = posAtCoords;
		const txn = view.state.tr;
		const insideNode = view.state.doc.nodeAt(inside);
		if (NodeSelection.isSelectable(insideNode)) {
			const selection = NodeSelection.create(view.state.doc, inside);
			txn.setSelection(selection);
		} else {
			const resolvedPos = view.state.doc.resolve(pos);
			const selection = Selection.near(resolvedPos);
			txn.setSelection(selection);
		}
		txn.setMeta('latestDomEvent', clickEvent);
		view.dispatch(txn);
	}
};
