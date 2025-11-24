import type { z } from 'zod';

import type { Prettify } from 'types';
import type { analyticsSettingsSchema } from 'utils/api/schemas/analyticsSettings';

export type AnalyticsSettings = z.infer<typeof analyticsSettingsSchema>;

export type AnalyticsType = NonNullable<AnalyticsSettings>['type'];

export type AnalyticsSettingsOfType<T extends AnalyticsType = AnalyticsType> = Prettify<
	AnalyticsSettings & { type: T }
>;
