import type { AnalyticsInstance } from 'analytics';

import type { AnalyticsSettings, LocationData } from 'types';

import { useEffect, useState } from 'react';

import { createAnalyticsInstance, createInitialAnalyticsInstance } from './createAnalyticsInstance';
import { ignoredPaths } from './ignoredPaths';

export const useLazyLoadedAnalyticsInstance = ({
	appname = 'pubpub',
	canUseCustomAnalyticsProvider,
	gdprConsent,
	analyticsSettings,
	locationData,
}: {
	appname?: string;
	canUseCustomAnalyticsProvider?: boolean;
	gdprConsent?: boolean | null;
	analyticsSettings: AnalyticsSettings;
	locationData: LocationData;
}) => {
	const isIgnoredPath = ignoredPaths.some((path) => path.test(locationData.path));

	// first we load the initial instance without any third party plugins
	const [analytics, setAnalytics] = useState<AnalyticsInstance>(
		createInitialAnalyticsInstance({
			// we don't want the analytics plugin to load on ignored paths
			stub: isIgnoredPath,
		}),
	);

	const needsCustomPlugin = canUseCustomAnalyticsProvider && analyticsSettings !== null;

	useEffect(() => {
		if (!needsCustomPlugin || isIgnoredPath) {
			return;
		}

		// only now do we load the custom plugin asynchonously, that way users
		// that e.g. decline google analytics will never interact with GA
		createAnalyticsInstance({
			appname,
			canUseCustomAnalyticsProvider,
			gdprConsent,
			analyticsSettings,
		}).then(setAnalytics);
	}, [Boolean(gdprConsent && needsCustomPlugin)]);

	return analytics;
};
