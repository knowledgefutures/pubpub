import type { AnalyticsInstance } from 'analytics';
import { useEffect, useState } from 'react';
import { AnalyticsSettings, LocationData } from 'types';
import { createAnalyticsInstance, createInitialAnalyticsInstance } from './createAnalyticsInstance';
import { ingoredPaths } from './ignoredPaths';

export const useLazyLoadedAnalyticsInstance = ({
	appname = 'pubpub',
	shouldUseNewAnalytics,
	canUseCustomAnalyticsProvider,
	gdprConsent,
	analyticsSettings,
	locationData,
}: {
	appname?: string;
	shouldUseNewAnalytics?: boolean;
	canUseCustomAnalyticsProvider?: boolean;
	gdprConsent?: boolean | null;
	analyticsSettings: AnalyticsSettings;
	locationData: LocationData;
}) => {
	const [analytics, setAnalytics] = useState<AnalyticsInstance>(
		createInitialAnalyticsInstance(shouldUseNewAnalytics),
	);

	const isIgnoredPath = ingoredPaths.some((path) => path.test(locationData.path));

	const needsCustomPlugin =
		shouldUseNewAnalytics &&
		canUseCustomAnalyticsProvider &&
		analyticsSettings !== null &&
		!isIgnoredPath;

	useEffect(() => {
		if (!needsCustomPlugin) {
			return;
		}

		createAnalyticsInstance({
			appname,
			shouldUseNewAnalytics,
			canUseCustomAnalyticsProvider,
			gdprConsent,
			analyticsSettings,
		}).then(setAnalytics);
	}, [Boolean(gdprConsent && needsCustomPlugin)]);

	return analytics;
};
