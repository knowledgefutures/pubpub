import { useState, useRef, useEffect } from 'react';
import createFocusTrap from 'focus-trap';

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
				initialFocus: refElement,
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
