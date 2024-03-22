// we use @analytics/core instead of analytics to avoid setting cookies
// @ts-expect-error FIXME: types from @analytics/core are not bundled properly
import { Analytics } from '@analytics/core';
import type { AnalyticsInstance } from 'analytics';
import type { AnalyticsSettings } from 'types';
import { analyticsPlugin, stubPlugin } from './plugin';
import { thirdPartyPlugins, thirdPartyPluginsThatNeedGdprConsent } from './thirdPartyPlugins';

const loadAnalyticsPlugins = async ({
	shouldStub,
	canUseCustomAnalyticsProvider,
	gdprConsent,
	analyticsSettings,
}: {
	shouldStub?: boolean;
	gdprConsent?: boolean | null;
	canUseCustomAnalyticsProvider?: boolean;
	analyticsSettings: AnalyticsSettings;
}) => {
	const { type = null, credentials = null } = analyticsSettings ?? {};

	if (shouldStub) {
		return [stubPlugin()];
	}

	const analyticsPlugins = [analyticsPlugin()];

	if (!canUseCustomAnalyticsProvider) {
		return analyticsPlugins;
	}

	if (!type) {
		return analyticsPlugins;
	}

	const provider = thirdPartyPlugins[type];
	if (!provider) {
		throw new Error(`Unknown analytics provider: ${type}`);
	}

	if (provider.needsGdprConsent && !gdprConsent) {
		return analyticsPlugins;
	}

	const loadedPlugin = await provider.load(credentials);

	return [...analyticsPlugins, loadedPlugin];
};

export const setGdprSensitivePlugins = async (
	analytics: AnalyticsInstance,
	gdprConsent?: boolean | null,
) => {
	const { plugins } = analytics.getState();

	if (!thirdPartyPluginsThatNeedGdprConsent.some((plugin) => plugin in plugins)) {
		return;
	}

	await Promise.all(
		thirdPartyPluginsThatNeedGdprConsent.map((pluginName) => {
			if (gdprConsent) {
				return analytics.plugins.enable(pluginName);
			}
			return analytics.plugins.disable(pluginName, () => {});
		}),
	);
};

export const createAnalyticsInstance = async ({
	appname = 'pubpub',
	canUseCustomAnalyticsProvider,
	gdprConsent,
	analyticsSettings,
}: {
	appname?: string;
	canUseCustomAnalyticsProvider?: boolean;
	gdprConsent?: boolean | null;
	analyticsSettings: AnalyticsSettings;
}) => {
	const plugins = await loadAnalyticsPlugins({
		canUseCustomAnalyticsProvider,
		analyticsSettings,
		gdprConsent,
	});

	const analytics = Analytics({
		app: appname,
		debug: true,
		plugins,
	}) as AnalyticsInstance;

	await setGdprSensitivePlugins(analytics, gdprConsent);

	return analytics;
};

export const createInitialAnalyticsInstance = ({ stub }: { stub?: boolean } = { stub: false }) =>
	Analytics({
		app: 'pubpub',
		debug: true,
		plugins: [stub ? stubPlugin() : analyticsPlugin()],
	}) as AnalyticsInstance;
