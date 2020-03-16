import { useEffect, useRef } from 'react';
import stickybits from 'stickybits';

const useOrFakeResizeObserver = (onResize) => {
	const lastBodyHeight = useRef(null);
	useEffect(() => {
		if (typeof window !== 'undefined') {
			if ('ResizeObserver' in window) {
				const observer = new ResizeObserver(onResize);
				observer.observe(document.body);
				return () => observer.disconnect();
			}
			const interval = setInterval(() => {
				const bodyHeight = document.body.offsetHeight;
				if (bodyHeight !== lastBodyHeight.current) {
					lastBodyHeight.current = bodyHeight;
					onResize();
				}
			}, 100);
			return () => clearInterval(interval);
		}
		return () => {};
	}, [onResize]);
};

export const useSticky = ({ selector, offset = 0, isActive = true }) => {
	const stickyInstanceRef = useRef(null);

	useEffect(() => {
		if (isActive) {
			stickyInstanceRef.current = stickybits(selector, {
				stickyBitStickyOffset: offset,
				useStickyClasses: true,
			});
			return () => stickyInstanceRef.current.cleanup();
		}
		return () => {};
	}, [isActive, offset, selector]);

	useOrFakeResizeObserver(() => stickyInstanceRef.current && stickyInstanceRef.current.update());
};
