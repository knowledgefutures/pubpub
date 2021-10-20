import { getClientInitialData } from './initialData';

export const isFeatureFlagEnabled = (name: string): boolean => {
	const initialData = getClientInitialData();
	return !!initialData.featureFlags[name];
};
