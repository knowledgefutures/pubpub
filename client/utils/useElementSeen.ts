import { useEffect, useRef, useState } from 'react';

type Options = {
	alreadySeen?: boolean;
	container: null | HTMLDivElement;
	element: null | HTMLDivElement;
	enabled: boolean;
	onElementSeen: () => unknown;
};

export const useElementSeen = (options: Options) => {
	const { container, element, enabled, onElementSeen, alreadySeen } = options;
	const [seen, setSeen] = useState(alreadySeen);
	const onElementSeenRef = useRef(onElementSeen);

	// Using a ref here prevents us from running the effect hook every time the provided callback
	// is changed (possibly ever render) while ensuring the latest version gets run.
	onElementSeenRef.current = onElementSeen;

	useEffect(() => {
		if (container && element && enabled && !seen) {
			const observer = new IntersectionObserver(
				([entry]) => {
					if (entry.isIntersecting) {
						setSeen(true);
						onElementSeenRef.current?.();
					}
				},
				{
					threshold: 1,
					root: container,
				},
			);
			observer.observe(element);
			return () => observer.disconnect();
		}
		return () => {};
	}, [container, element, enabled, seen]);
};
