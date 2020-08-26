import { useState, useRef, useEffect, useCallback } from 'react';

const isChildOfReakitPortal = (element) => {
	const ancestors = [];
	// @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'any' is not assignable to parame... Remove this comment to see the full error message
	ancestors.push(element);
	while (element.parentNode) {
		// @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'any' is not assignable to parame... Remove this comment to see the full error message
		ancestors.unshift(element.parentNode);
		// eslint-disable-next-line no-param-reassign
		element = element.parentNode;
	}
	return ancestors.some(
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'classList' does not exist on type 'never... Remove this comment to see the full error message
		(ancestor) => ancestor.classList && ancestor.classList.contains('__reakit-portal'),
	);
};

const rememberScrollPosition = () => {
	const { scrollX, scrollY } = window;
	return {
		restore: () => {
			if (typeof window.scrollTo === 'function') {
				window.scrollTo(scrollX, scrollY);
			}
		},
	};
};

const isTargetOutsideOfRoot = (rootElement, target) => {
	return !rootElement || (!rootElement.contains(target) && !isChildOfReakitPortal(target));
};

// This implementation heavily inspired by the wonder-blocks focus trap:
// https://github.com/Khan/wonder-blocks/blob/master/packages/wonder-blocks-modal/components/focus-trap.js
export const useFocusTrap = ({
	// @ts-expect-error ts-migrate(2525) FIXME: Initializer provides no value for this binding ele... Remove this comment to see the full error message
	onMouseDownOutside,
	// @ts-expect-error ts-migrate(2525) FIXME: Initializer provides no value for this binding ele... Remove this comment to see the full error message
	onEscapeKeyPressed,
	// @ts-expect-error ts-migrate(2525) FIXME: Initializer provides no value for this binding ele... Remove this comment to see the full error message
	onClickOutside,
	// @ts-expect-error ts-migrate(2525) FIXME: Initializer provides no value for this binding ele... Remove this comment to see the full error message
	isActive,
	// @ts-expect-error ts-migrate(2525) FIXME: Initializer provides no value for this binding ele... Remove this comment to see the full error message
	restoreFocusTarget,
} = {}) => {
	const [rootElement, setRefElement] = useState(null);
	const ignoreFocusChanges = useRef(false);
	const lastNodeFocusedInModal = useRef(null);
	const lastGoodScrollPosition = useRef(null);
	const hasSeenMouseDownOutside = useRef(false);

	const tryToFocus = useCallback((node) => {
		if (node instanceof HTMLElement) {
			ignoreFocusChanges.current = true;
			try {
				node.focus();
			} catch (e) {
				// ignore error
			}
			ignoreFocusChanges.current = false;
			return document.activeElement === node;
		}
		return false;
	}, []);

	const focusLastElementIn = useCallback(
		(currentParent) => {
			const children = currentParent.childNodes;
			for (let i = children.length - 1; i >= 0; i -= 1) {
				const child = children[i];
				if (tryToFocus(child) || focusLastElementIn(child)) {
					return true;
				}
			}
			return false;
		},
		[tryToFocus],
	);

	const focusFirstElementIn = useCallback(
		(currentParent) => {
			const children = currentParent.childNodes;
			for (let i = 0; i < children.length; i += 1) {
				const child = children[i];
				if (tryToFocus(child) || focusFirstElementIn(child)) {
					return true;
				}
			}
			return false;
		},
		[tryToFocus],
	);

	const handleGlobalFocus = useCallback(
		(evt) => {
			const { target } = evt;

			// We can ignore a focus event if:
			const eventIsIgnorable =
				// 1. it is triggered by this hook's own attempts to move focus
				ignoreFocusChanges.current ||
				// 2. the hook is not active
				!isActive ||
				// 3. the focus is set to the document itself
				!(target instanceof Node) ||
				// 4. we don't have a reference to a container element yet
				!rootElement;

			if (eventIsIgnorable) {
				return;
			}

			// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
			if (rootElement.contains(target)) {
				lastNodeFocusedInModal.current = target;

				// Keep track of our scroll position so we can restore it later
				// @ts-expect-error ts-migrate(2322) FIXME: Type '{ restore: () => void; }' is not assignable ... Remove this comment to see the full error message
				lastGoodScrollPosition.current = rememberScrollPosition();
			} else {
				if (isChildOfReakitPortal(target)) {
					return;
				}

				// Restore our last good scroll position
				if (lastGoodScrollPosition.current) {
					// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
					lastGoodScrollPosition.current.restore();
				}

				// If the newly focused node is outside the modal, we try refocusing
				// the first focusable node of the modal. (This could be the user
				// pressing Tab on the last node of the modal, or focus escaping in
				// some other way.)
				focusFirstElementIn(rootElement);

				// But, if it turns out that the first focusable node of the modal
				// was what we were previously focusing, then this is probably the
				// user pressing Shift-Tab on the first node, wanting to go to the
				// end. So, we instead try focusing the last focusable node of the
				// modal.
				if (document.activeElement === lastNodeFocusedInModal.current) {
					focusLastElementIn(rootElement);
				}

				// Focus should now be inside the modal, so record the newly-focused
				// node as the last node focused in the modal.
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'Element' is not assignable to type 'null'.
				lastNodeFocusedInModal.current = document.activeElement;
			}
		},
		[focusFirstElementIn, focusLastElementIn, isActive, rootElement],
	);

	const handleGlobalMouseDown = useCallback(
		(evt) => {
			const { target } = evt;
			if (isTargetOutsideOfRoot(rootElement, target)) {
				hasSeenMouseDownOutside.current = true;
				if (onMouseDownOutside) {
					onMouseDownOutside(evt);
				}
			}
		},
		[onMouseDownOutside, rootElement],
	);

	const handleGlobalClick = useCallback(
		(evt) => {
			const { target } = evt;
			if (
				isTargetOutsideOfRoot(rootElement, target) &&
				onClickOutside &&
				hasSeenMouseDownOutside.current
			) {
				onClickOutside(evt);
			}
		},
		[onClickOutside, rootElement],
	);

	const handleKeyDown = useCallback(
		(evt) => {
			if (evt.key === 'Escape') {
				if (onEscapeKeyPressed) {
					evt.stopPropagation();
					onEscapeKeyPressed(evt);
				}
			}
		},
		[onEscapeKeyPressed],
	);

	useEffect(() => {
		window.addEventListener('focus', handleGlobalFocus, true);
		return () => window.removeEventListener('focus', handleGlobalFocus, true);
	}, [handleGlobalFocus]);

	useEffect(() => {
		const options = { capture: true };
		window.addEventListener('mousedown', handleGlobalMouseDown, options);
		return () => window.removeEventListener('mousedown', handleGlobalMouseDown, options);
	}, [handleGlobalMouseDown]);

	useEffect(() => {
		const options = { capture: true };
		window.addEventListener('click', handleGlobalClick, options);
		return () => window.removeEventListener('click', handleGlobalClick, options);
	}, [handleGlobalClick]);

	useEffect(() => {
		if (rootElement) {
			// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
			rootElement.addEventListener('keydown', handleKeyDown);
			// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
			return () => rootElement.removeEventListener('keydown', handleKeyDown);
		}
		return () => {};
	}, [handleKeyDown, rootElement]);

	useEffect(() => {
		// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
		if (rootElement && isActive && !rootElement.contains(document.activeElement)) {
			// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
			const previousTabIndex = rootElement.tabIndex;
			// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
			rootElement.tabIndex = -1;
			tryToFocus(rootElement);
			return () => {
				// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
				rootElement.tabIndex = previousTabIndex;
			};
		}
		return () => {};
	}, [isActive, rootElement, tryToFocus]);

	useEffect(() => {
		const previouslyActiveElement = document.activeElement;
		return () => {
			const initialScrollPosition = rememberScrollPosition();
			tryToFocus(restoreFocusTarget || previouslyActiveElement);
			initialScrollPosition.restore();
		};
	}, [restoreFocusTarget, tryToFocus]);

	return {
		ref: setRefElement,
	};
};
