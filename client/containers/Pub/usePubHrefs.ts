import { useEffect } from 'react';

type Options = {
	enabled: boolean;
};

const isInViewport = (rect: DOMRect, offsets: { top?: number; left?: number } = {}) => {
	const { top, left, bottom, right } = rect;
	const { innerWidth, innerHeight } = window;
	const { clientWidth, clientHeight } = document.documentElement;
	const { top: offsetTop, left: offsetLeft } = { top: 0, left: 0, ...offsets };

	return (
		top >= offsetTop &&
		left >= offsetLeft &&
		bottom <= (innerHeight || clientHeight) &&
		right <= (innerWidth || clientWidth)
	);
};

const scrollToElementTop = (hash: string, delay = 0) => {
	let element: HTMLElement | null;
	try {
		element = document.getElementById(hash.replace('#', ''));
	} catch {
		return;
	}
	if (!element) {
		return;
	}
	setTimeout(() => {
		const rect = (element as HTMLElement).getBoundingClientRect();
		if (!isInViewport(rect, { top: 50 })) {
			document.body.scrollTop += rect.top - 80;
		}
	}, delay);
};

export const usePubHrefs = (options: Options) => {
	const { enabled } = options;

	useEffect(() => {
		const { hash } = window.location;
		if (hash) {
			scrollToElementTop(hash, 500);
		}
	}, []);

	useEffect(() => {
		const onClick = (event: MouseEvent) => {
			const { target, metaKey } = event;
			if (target instanceof HTMLAnchorElement && !metaKey) {
				const href = target.getAttribute('href');
				if (href && href.indexOf('#') === 0) {
					event.preventDefault();
					window.location.hash = href;
					scrollToElementTop(href);
				}
			}
		};
		if (enabled) {
			document.addEventListener('click', onClick);
			return () => document.removeEventListener('click', onClick);
		}
		return () => {};
	}, [enabled]);
};
