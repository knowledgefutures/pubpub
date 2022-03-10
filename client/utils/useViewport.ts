import { useEffect, useState } from 'react';

export const useViewport = () => {
	const [viewportWidth, setViewportWidth] = useState<number | null>(null);
	const [viewportHeight, setViewportHeight] = useState<number | null>(null);

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

	return { viewportWidth, viewportHeight };
};
