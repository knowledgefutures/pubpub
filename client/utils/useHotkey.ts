import { useEffect } from 'react';

import { useRefMap } from 'client/utils/useRefMap';

type Options = {
	allowTakingFocusFromChild?: boolean;
};

const focusableElements = [
	'a',
	'button',
	'input',
	'textarea',
	'select',
	'details',
	'[tabindex]:not([tabindex="-1"])',
];

const focusableElementsQuery = focusableElements
	.map((element) => `${element}:not([disabled])`)
	.join(',');

const getKeyboardFocusableElement = (element: HTMLElement): null | HTMLElement => {
	if (element.matches(focusableElementsQuery)) {
		return element;
	}
	return element.querySelector(focusableElementsQuery);
};

const shouldRetainCurrentActiveElement = (
	allowTakingFocusFromChild: boolean,
	targetElement: HTMLElement,
) => {
	if (allowTakingFocusFromChild) {
		return false;
	}
	const { activeElement } = document;
	return activeElement === targetElement || targetElement.contains(activeElement);
};

export const useHotkeys = <T extends HTMLElement>(options: Options = {}) => {
	const { allowTakingFocusFromChild = false } = options;
	const { refs, getRef } = useRefMap<T>();

	useEffect(() => {
		const listener = (evt: KeyboardEvent) => {
			const { key } = evt;
			if (refs[key]) {
				const { current: targetElement } = refs[key];
				if (targetElement) {
					const focusableElement = getKeyboardFocusableElement(targetElement);
					if (
						focusableElement &&
						!shouldRetainCurrentActiveElement(allowTakingFocusFromChild, targetElement)
					) {
						focusableElement.focus();
					}
				}
			}
		};
		document.addEventListener('keydown', listener);
		return () => document.removeEventListener('keydown', listener);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return { hotkeyRef: getRef };
};
