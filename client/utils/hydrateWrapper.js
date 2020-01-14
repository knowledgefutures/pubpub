import React from 'react';
import * as Sentry from '@sentry/browser';
import { hydrate } from 'react-dom';
import { FocusStyleManager } from '@blueprintjs/core';

import { getClientInitialData } from './initialData';
import { setupKeen } from './keen';
import { setIsProd } from './isProd';

const isStorybookEnv = (windowObj) =>
	windowObj.location.origin === 'http://localhost:9001' || windowObj.STORYBOOK_ENV === 'react';

const isLocalEnv = (windowObj) => windowObj.location.origin.indexOf('localhost:') > -1;

export const hydrateWrapper = (Component) => {
	if (typeof window !== 'undefined' && !isStorybookEnv(window)) {
		FocusStyleManager.onlyShowFocusOnTabs();

		/* Remove any leftover service workers from last PubPub instance */
		if (window.navigator && navigator.serviceWorker) {
			navigator.serviceWorker.getRegistrations().then((registrations) => {
				registrations.forEach((registration) => {
					registration.unregister();
				});
			});
		}

		const initialData = getClientInitialData();
		setIsProd(initialData.locationData.isPubPubProduction);
		const viewData = JSON.parse(document.getElementById('view-data').getAttribute('data-json'));
		const chunkName = JSON.parse(
			document.getElementById('chunk-name').getAttribute('data-json'),
		);
		if (!isLocalEnv(window)) {
			setupKeen();
			window.sentryIsActive = true;
			Sentry.init({ dsn: 'https://abe1c84bbb3045bd982f9fea7407efaa@sentry.io/1505439' });
			Sentry.setUser({
				id: initialData.loginData.id,
				username: initialData.loginData.slug,
			});
		}

		hydrate(
			<Component initialData={initialData} viewData={viewData} chunkName={chunkName} />,
			document.getElementById('root'),
		);
	}
};
