import { useEffect, useState } from 'react';

type Options = {
	withEarlyMeasurement?: boolean;
};

const getEarlyViewport = () => {
	if (typeof window !== 'undefined') {
		return {
			earlyViewportWidth: window.innerWidth,
			earlyViewportHeight: window.innerHeight,
		};
	}
	return { earlyViewportWidth: null, earlyViewportHeight: null };
};

const { earlyViewportWidth, earlyViewportHeight } = getEarlyViewport();

export const useViewport = (options: Options = {}) => {
	const { withEarlyMeasurement = false } = options;
	const [viewportWidth, setViewportWidth] = useState<number | null>(
		withEarlyMeasurement ? earlyViewportWidth : null,
	);
	const [viewportHeight, setViewportHeight] = useState<number | null>(
		withEarlyMeasurement ? earlyViewportHeight : null,
	);

	useEffect(() => {
		setViewportWidth(window.innerWidth);
		setViewportHeight(window.innerHeight);
		const listener = () => {
			setViewportHeight(window.innerHeight);
			setViewportWidth(window.innerWidth);
		};
		window.addEventListener('resize', listener);
		return () => window.removeEventListener('resize', listener);
	}, []);

	return {
		viewportWidth,
		viewportHeight,
		isMobile: typeof viewportWidth === 'number' ? viewportWidth <= 750 : null,
	};
};
