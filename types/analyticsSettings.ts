import type { z } from 'zod';
import { Prettify } from 'types';
import { type analyticsSettingsSchema } from 'utils/api/schemas/analyticsSettings';

export type AnalyticsSettings = z.infer<typeof analyticsSettingsSchema>;

export type AnalyticsType = AnalyticsSettings['type'];

export type AnalyticsSettingsOfType<T extends AnalyticsType = AnalyticsType> = Prettify<
	AnalyticsSettings & { type: T }
>;

export type AnalyticsWithConsent =
	| (AnalyticsSettingsOfType<'default'> & { consent?: false })
	| (AnalyticsSettingsOfType<Exclude<AnalyticsType, 'default'>> & { consent?: boolean });
