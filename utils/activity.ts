import { ActivityAssociations, ActivityAssociationType, activityAssociationTypes } from 'types';

const createEmptyAssociationsObject = <T>(factory: () => T): Record<ActivityAssociationType, T> => {
	const associations: Partial<Record<ActivityAssociationType, T>> = {};
	activityAssociationTypes.forEach((type) => {
		associations[type] = factory();
	});
	return associations as Record<ActivityAssociationType, T>;
};

export const createActivityAssociationArrays = () =>
	createEmptyAssociationsObject(() => [] as string[]);

export const createActivityAssociationSets = () =>
	createEmptyAssociationsObject(() => new Set<string>());

export const createActivityAssociations = () =>
	createEmptyAssociationsObject(() => ({})) as ActivityAssociations;
