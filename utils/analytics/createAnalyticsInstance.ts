// @ts-expect-error FIXME: types from @analytics/core are not bundled properly
import { Analytics } from '@analytics/core';
import type { AnalyticsInstance } from 'analytics';
import googleAnalyticsPlugin from '@analytics/google-analytics';
import simpleAnalyticsPlugin from '@analytics/simple-analytics';
import type { AnalyticsSettings } from 'types';
import { analyticsPlugin, stubPlugin } from './plugin';

// TODO: lazy load the plugins. Might be hard as they are needed when the page first loads, forcing a lot of rerenders
const getPluginsForType = ({
	shouldStub,
	canUseCustomAnalyticsProvider,
	googleAnalyticsRefused,
	analyticsSettings,
}: {
	shouldStub?: boolean;
	googleAnalyticsRefused?: boolean;
	canUseCustomAnalyticsProvider?: boolean;
	analyticsSettings: AnalyticsSettings;
}) => {
	if (shouldStub) {
		return [stubPlugin()];
	}

	const analyticsPlugins = [analyticsPlugin()];

	if (!canUseCustomAnalyticsProvider) {
		return analyticsPlugins;
	}

	switch (analyticsSettings?.type) {
		case 'simple-analytics': {
			analyticsPlugins.push(
				simpleAnalyticsPlugin({
					autoCollect: false,
				}),
			);
			break;
		}
		case 'google-analytics': {
			if (googleAnalyticsRefused) {
				break;
			}
			analyticsPlugins.push(
				googleAnalyticsPlugin({
					measurementIds: [analyticsSettings.credentials],
				}),
			);
			break;
		}
		default:
			break;
	}

	return analyticsPlugins;
};

export const createAnalyticsInstance = ({
	appname = 'pubpub',
	shouldUseNewAnalytics,
	canUseCustomAnalyticsProvider,
	gdprConsent,
	analyticsSettings,
}: {
	appname?: string;
	shouldUseNewAnalytics?: boolean;
	canUseCustomAnalyticsProvider?: boolean;
	gdprConsent?: boolean | null;
	analyticsSettings: AnalyticsSettings;
}) => {
	const googleAnalyticsRefused = analyticsSettings?.type === 'google-analytics' && !gdprConsent;

	const plugins = getPluginsForType({
		shouldStub: !shouldUseNewAnalytics,
		canUseCustomAnalyticsProvider,
		googleAnalyticsRefused,
		analyticsSettings,
	});

	const analytics = Analytics({
		app: appname,
		debug: true,
		plugins,
	});

	return analytics as AnalyticsInstance;
};
