// @ts-expect-error FIXME: types from @analytics/core are not bundled properly
import { Analytics } from '@analytics/core';
import type { AnalyticsInstance } from 'analytics';
import googleTagPlugin from '@analytics/google-tag-manager';
import googleAnalytics from '@analytics/google-analytics';
import type { AnalyticsSettings, AnalyticsWithConsent } from 'types';
import { analyticsPlugin, stubPlugin } from './plugin';

// TODO: lazy load the plugins. Might be hard as they are needed when the page first loads, forcing a lot of rerenders
// TODO: Add other analytics options
// TODO: Figure out whether all analytics need consent
const getPluginForType = ({
	type,
	credentials,
	shouldStub,
}: AnalyticsSettings & { shouldStub?: boolean }) => {
	if (shouldStub) {
		return stubPlugin();
	}

	switch (type) {
		case 'GTM': {
			return googleTagPlugin({
				containerId: credentials,
			});
		}
		case 'GA': {
			return googleAnalytics({
				measurementIds: [credentials],
			});
		}
		default: {
			return analyticsPlugin();
		}
	}
};

export const createAnalyticsInstance = ({
	appname = 'pubpub',
	shouldUseNewAnalytics,
	...settings
}: {
	appname?: string;
	shouldUseNewAnalytics?: boolean;
} & AnalyticsWithConsent) => {
	const noConsent = settings.type !== 'default' && !settings.consent;

	const plugin = getPluginForType({
		...settings,
		shouldStub: !shouldUseNewAnalytics || noConsent,
	});

	const analytics = Analytics({
		app: appname,
		debug: true,
		plugins: [plugin],
	});

	return analytics as AnalyticsInstance;
};
