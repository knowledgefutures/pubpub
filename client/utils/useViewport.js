import { useEffect, useState } from 'react';

export const useViewport = () => {
	const [viewportWidth, setViewportWidth] = useState(null);

	useEffect(() => {
		setViewportWidth(window.innerWidth);
		const listener = () => setViewportWidth(window.innerWidth);
		window.addEventListener('resize', listener);
		return () => window.removeEventListener('resize', listener);
	}, []);

	return { viewportWidth: viewportWidth };
};
