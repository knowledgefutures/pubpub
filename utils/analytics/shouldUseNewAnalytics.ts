import { InitialData } from 'types';

export const shouldUseNewAnalytics = (featureFlags: InitialData['featureFlags']) =>
	featureFlags?.newAnalytics;
