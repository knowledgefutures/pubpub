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

const defaultOnClickOutside = () => {};

export const useFocusTrap = ({ onClickOutside = defaultOnClickOutside, isActive = true } = {}) => {
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

	const setupFocusTrap = () => {
		setFocusTrapActive(false);
		if (refElement) {
			focusTrap.current = createFocusTrap(refElement, {
				escapeDeactivates: false,
				clickOutsideDeactivates: true,
				allowOutsideClick: (evt) => {
					onClickOutside(evt);
					return true;
				},
			});
			setFocusTrapActive(true);
		}
		return () => setFocusTrapActive(false);
	};

	const pauseOrResumeFocusTrap = () => {
		setFocusTrapActive(isActive);
	};

	useEffect(setupFocusTrap, [refElement]);
	useEffect(pauseOrResumeFocusTrap, [isActive]);

	return {
		ref: setRefElement,
	};
};
