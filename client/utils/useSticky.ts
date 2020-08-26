import { useEffect, useRef } from 'react';
import stickybits from 'stickybits';

const useOrFakeResizeObserver = (onResize) => {
	const lastBodyHeight = useRef(null);
	useEffect(() => {
		if (typeof window !== 'undefined') {
			if ('ResizeObserver' in window) {
				// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ResizeObserver'.
				const observer = new ResizeObserver(onResize);
				observer.observe(document.body);
				return () => observer.disconnect();
			}
			const interval = setInterval(() => {
				const bodyHeight = document.body.offsetHeight;
				if (bodyHeight !== lastBodyHeight.current) {
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'number' is not assignable to type 'null'.
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
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'StickyBits' is not assignable to type 'null'... Remove this comment to see the full error message
			stickyInstanceRef.current = stickybits(selector, {
				stickyBitStickyOffset: offset,
				useStickyClasses: true,
			});
			// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
			return () => stickyInstanceRef.current.cleanup();
		}
		return () => {};
	}, [isActive, offset, selector]);

	// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
	useOrFakeResizeObserver(() => stickyInstanceRef.current && stickyInstanceRef.current.update());
};
