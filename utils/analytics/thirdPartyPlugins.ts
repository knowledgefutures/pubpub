import type { AnalyticsPlugin } from 'analytics';

import type { AnalyticsSettings, AnalyticsType } from 'types/analyticsSettings';

export type ThirdPartyPluginsShape = {
	[K in AnalyticsType]?: {
		key: K;
		name: string;
		needsGdprConsent: boolean;
		load: (
			credentials: (AnalyticsSettings & { key: K })['credentials'],
		) => Promise<AnalyticsPlugin>;
	};
};

export const thirdPartyPlugins = {
	'google-analytics': {
		key: 'google-analytics',
		name: 'Google Analytics',
		needsGdprConsent: true,
		load: (credentials) =>
			import(
				/* webpackChunkName: "@analytics/google-analytics" */
				'@analytics/google-analytics'
			).then(({ default: googleAnalyticsPlugin }) =>
				googleAnalyticsPlugin({ measurementIds: [credentials] }),
			),
	},
	'simple-analytics': {
		key: 'simple-analytics',
		name: 'Simple Analytics',
		needsGdprConsent: false,
		load: () =>
			import(
				/* webpackChunkName: "@analytics/simple-analytics" */
				'@analytics/simple-analytics'
			).then(({ default: simpleAnalyticsPlugin }) =>
				simpleAnalyticsPlugin({ autoCollect: false }),
			),
	},
} as const satisfies ThirdPartyPluginsShape;

export type ThirdPartyPlugins = typeof thirdPartyPlugins;

export type ThirdPartyPlugin = ThirdPartyPlugins[keyof ThirdPartyPlugins];

export const thirdPartyPluginsThatNeedGdprConsent = Object.values(thirdPartyPlugins)
	.filter(
		(plugin): plugin is Extract<ThirdPartyPlugin, { needsGdprConsent: true }> =>
			plugin.needsGdprConsent,
	)
	.map((provider) => provider.key);

export const getThirdPartyPluginsObjectWithGdprConsent = (
	gdprConsent: boolean | null,
	plugins: {
		[K in AnalyticsType | 'analytics-plugin']?: {
			enabled: boolean;
			loaded: boolean;
			initialized: boolean;
			config: Record<string, any>;
		};
	},
) => {
	return Object.entries(plugins).reduce(
		(acc, [pluginName, plugin]) => {
			if (plugins && !plugin?.enabled) {
				return acc;
			}

			if (!thirdPartyPlugins[pluginName]) {
				return acc;
			}

			const isEnabledAndHasConsent =
				plugin.enabled && (gdprConsent || !thirdPartyPlugins[pluginName]?.needsGdprConsent);

			acc[pluginName] = isEnabledAndHasConsent;
			return acc;
		},
		{} as Record<AnalyticsType, boolean>,
	);
};
