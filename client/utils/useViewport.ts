import { useEffect, useState } from 'react';

export const useViewport = () => {
	const [viewportWidth, setViewportWidth] = useState(null);

	useEffect(() => {
		// @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'number' is not assignable to par... Remove this comment to see the full error message
		setViewportWidth(window.innerWidth);
		// @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'number' is not assignable to par... Remove this comment to see the full error message
		const listener = () => setViewportWidth(window.innerWidth);
		window.addEventListener('resize', listener);
		return () => window.removeEventListener('resize', listener);
	}, []);

	return { viewportWidth: viewportWidth };
};
