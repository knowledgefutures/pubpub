import { useState, useRef, useEffect } from 'react';
import createFocusTrap from 'focus-trap';

const clickHandlerOptions = { capture: true };

const isDescendant = (parent, child) => {
	let node = child;
	while (node !== null) {
		if (node === parent) {
			return true;
		}
		node = node.parentElement;
	}
	return false;
};

export const useFocusTrap = ({ clickOutsideDeactivates = false, isActive = true } = {}) => {
	const [refElement, setRefElement] = useState(null);
	const focusTrap = useRef(null);

	const setFocusTrapActive = (value) => {
		if (focusTrap.current) {
			if (value) {
				focusTrap.current.activate();
			} else {
				focusTrap.current.deactivate();
			}
		}
	};

	useEffect(() => {
		setFocusTrapActive(false);
		if (refElement) {
			focusTrap.current = createFocusTrap(refElement, {
				escapeDeactivates: false,
				returnFocusOnDeactivate: false,
				clickOutsideDeactivates: clickOutsideDeactivates,
			});
			setFocusTrapActive(true);
		}
		return () => setFocusTrapActive(false);
	}, [refElement, clickOutsideDeactivates]);

	useEffect(() => {
		setFocusTrapActive(isActive);
	}, [isActive]);

	return {
		ref: setRefElement,
	};
};
