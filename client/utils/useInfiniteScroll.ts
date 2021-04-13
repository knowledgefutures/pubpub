import { useEffect } from 'react';

type Options = {
	onRequestMoreItems: undefined | null | (() => unknown);
	enabled: boolean;
	scrollTolerance?: number;
} & ({ element: undefined | null | HTMLElement } | { useDocumentElement: true });

const isScrolledToBottom = (element: HTMLElement, tolerance: number) => {
	return element.scrollHeight - element.scrollTop - tolerance <= element.clientHeight;
};

const resolveElementFromOptions = (options: Options) => {
	if ('useDocumentElement' in options) {
		if (typeof document !== 'undefined') {
			return document.documentElement;
		}
		return null;
	}
	return options.element;
};

export const useInfiniteScroll = (options: Options) => {
	const { enabled, onRequestMoreItems, scrollTolerance = 0 } = options;
	const element = resolveElementFromOptions(options);

	useEffect(() => {
		if (element && enabled && onRequestMoreItems) {
			const measureElement = () => {
				if (element && enabled && isScrolledToBottom(element, scrollTolerance)) {
					onRequestMoreItems();
				}
			};
			measureElement();
			const target = element === document.documentElement ? window : element;
			target.addEventListener('scroll', measureElement);
			return () => target.removeEventListener('scroll', measureElement);
		}
		return () => {};
	}, [element, enabled, scrollTolerance, onRequestMoreItems]);
};
