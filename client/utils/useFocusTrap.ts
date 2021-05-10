import { useState, useRef, useEffect, useCallback } from 'react';
import { Maybe } from 'types';

type EventHandler<E extends Event> = (evt: E) => unknown;

type FocusTrapOptions = {
	onMouseDownOutside?: Maybe<EventHandler<MouseEvent>>;
	onEscapeKeyPressed?: Maybe<EventHandler<KeyboardEvent>>;
	onClickOutside?: Maybe<EventHandler<MouseEvent>>;
	isActive?: boolean;
	ignoreMouseEvents?: boolean;
	restoreFocusTarget?: Maybe<globalThis.Node>;
};

const captureEventOptions = { capture: true };

const isChildOfReakitPortal = (element: Element) => {
	const ancestors: Element[] = [];
	ancestors.push(element);
	while (element.parentElement) {
		ancestors.unshift(element.parentElement);
		element = element.parentElement;
	}
	return ancestors.some((ancestor) => ancestor.classList?.contains('__reakit-portal'));
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
	onMouseDownOutside = null,
	onEscapeKeyPressed = null,
	onClickOutside = null,
	isActive = false,
	ignoreMouseEvents = false,
	restoreFocusTarget = null,
}: FocusTrapOptions = {}) => {
	const [rootElement, setRefElement] = useState<null | HTMLElement>(null);
	const ignoreFocusChanges = useRef(false);
	const lastElementFocusedInModal = useRef<null | Element>(null);
	const lastGoodScrollPosition = useRef<null | ReturnType<typeof rememberScrollPosition>>(null);
	const hasSeenMouseDownOutside = useRef(false);
	const mouseDownTimeRef = useRef(0);

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
			const probablyFocusedByMouse = Date.now() - mouseDownTimeRef.current < 1000;

			// We can ignore a focus event if:
			const eventIsIgnorable =
				// 1. it is triggered by this hook's own attempts to move focus
				ignoreFocusChanges.current ||
				// 2. the hook is not active
				!isActive ||
				// 3. the focus is set to the document itself
				!(target instanceof Node) ||
				// 4. we don't have a reference to a container element yet
				!rootElement ||
				// 5. we are ignoring mouse events
				(probablyFocusedByMouse && ignoreMouseEvents);

			if (eventIsIgnorable) {
				return;
			}

			if (rootElement && rootElement.contains(target)) {
				lastElementFocusedInModal.current = target;

				// Keep track of our scroll position so we can restore it later
				lastGoodScrollPosition.current = rememberScrollPosition();
			} else {
				if (isChildOfReakitPortal(target)) {
					return;
				}

				// Restore our last good scroll position
				if (lastGoodScrollPosition.current) {
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
				if (document.activeElement === lastElementFocusedInModal.current) {
					focusLastElementIn(rootElement);
				}

				// Focus should now be inside the modal, so record the newly-focused
				// node as the last node focused in the modal.
				lastElementFocusedInModal.current = document.activeElement;
			}
		},
		[focusFirstElementIn, focusLastElementIn, isActive, rootElement, ignoreMouseEvents],
	);

	const handleGlobalMouseDown = useCallback(
		(evt) => {
			const { target } = evt;
			mouseDownTimeRef.current = Date.now();
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
		window.addEventListener('mousedown', handleGlobalMouseDown, captureEventOptions);
		return () =>
			window.removeEventListener('mousedown', handleGlobalMouseDown, captureEventOptions);
	}, [handleGlobalMouseDown]);

	useEffect(() => {
		window.addEventListener('click', handleGlobalClick, captureEventOptions);
		return () => window.removeEventListener('click', handleGlobalClick, captureEventOptions);
	}, [handleGlobalClick]);

	useEffect(() => {
		if (rootElement) {
			rootElement.addEventListener('keydown', handleKeyDown);
			return () => rootElement.removeEventListener('keydown', handleKeyDown);
		}
		return () => {};
	}, [handleKeyDown, rootElement]);

	useEffect(() => {
		if (rootElement && isActive && !rootElement.contains(document.activeElement)) {
			const previousTabIndex = rootElement.tabIndex;
			rootElement.tabIndex = -1;
			tryToFocus(rootElement);
			return () => {
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
