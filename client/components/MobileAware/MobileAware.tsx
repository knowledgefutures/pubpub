import React, { useEffect, useState } from 'react';

import { useViewport } from 'client/utils/useViewport';

import './mobileAware.scss';

export type RenderProps = { ref?: React.Ref<any>; className: string };
type Renderable = null | React.ReactElement | ((props: RenderProps) => React.ReactElement);

type Props = {
	desktop?: Renderable;
	mobile?: Renderable;
};

const componentPrefix = 'mobile-aware-component';

const renderMobileOrDesktop = (
	renderable: Renderable,
	ref: React.Ref<unknown>,
	isFirstMount: boolean,
	isMobileViewport: null | boolean,
	isMobileVersion: boolean,
) => {
	if (!renderable) {
		return null;
	}
	const matchesViewportSize = isMobileViewport === isMobileVersion;
	// During server-side rendering, isFirstMount is true, so we unconditionally render
	// both the provided mobile and the desktop versions, and rely on CSS to show only the
	// correct one. During the first client render, we already know what viewport size we have,
	// but we still need to render both elements because React insists that the first client
	// render match the server render exactly. After that, we can stop rendering one of them.
	if (!isFirstMount && !matchesViewportSize) {
		return null;
	}
	const renderProps: RenderProps = {
		className: isMobileVersion ? `${componentPrefix}__mobile` : `${componentPrefix}__desktop`,
		...(matchesViewportSize ? { ref } : null),
	};
	if (typeof renderable === 'function') {
		return renderable(renderProps);
	}
	return React.cloneElement(renderable, renderProps);
};

const MobileAware = React.forwardRef((props: Props, ref: React.Ref<unknown>) => {
	const { mobile = null, desktop = null } = props;
	const [isFirstMount, setIsFirstMount] = useState(true);
	const { isMobile } = useViewport({ withEarlyMeasurement: true });

	useEffect(() => setIsFirstMount(false), []);

	return (
		<>
			{renderMobileOrDesktop(mobile, ref, isFirstMount, isMobile, true)}
			{renderMobileOrDesktop(desktop, ref, isFirstMount, isMobile, false)}
		</>
	);
});

export default MobileAware;
