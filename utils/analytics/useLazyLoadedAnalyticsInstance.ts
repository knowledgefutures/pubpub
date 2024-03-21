import type { AnalyticsInstance } from 'analytics';
import { useEffect, useState } from 'react';
import { AnalyticsSettings, LocationData } from 'types';
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
	// first we load the initial instance without any third party plugins
	const [analytics, setAnalytics] = useState<AnalyticsInstance>(createInitialAnalyticsInstance());

	const isIgnoredPath = ignoredPaths.some((path) => path.test(locationData.path));

	const needsCustomPlugin =
		canUseCustomAnalyticsProvider && analyticsSettings !== null && !isIgnoredPath;

	useEffect(() => {
		if (!needsCustomPlugin) {
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
