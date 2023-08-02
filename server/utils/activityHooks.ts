import { ActivityItem } from 'server/models';
import { defer } from 'server/utils/deferred';

type MinimalInstanceProperties = {
	id: string;
};

type SequelizeModelInstance<T extends MinimalInstanceProperties> = T & {
	_previousDataValues: T;
};

export type CreateHookFn<T extends MinimalInstanceProperties> = ((
	name: string,
	fn: (
		model: SequelizeModelInstance<T>,
		options: { actorId?: string | null },
	) => void | Promise<void>,
) => void) &
	((
		fn: (
			model: SequelizeModelInstance<T>,
			options: { actorId?: string | null },
		) => void | Promise<void>,
	) => void);

type SequelizeModelSingleton<Instance extends MinimalInstanceProperties> = {
	afterCreate: CreateHookFn<Instance>;
	afterUpdate: CreateHookFn<Instance>;
	beforeDestroy: CreateHookFn<Instance>;
};

type CreateActivityHooksOptions<
	InstanceProperties extends MinimalInstanceProperties,
	ModelSingleton = SequelizeModelSingleton<InstanceProperties>,
> = {
	// It would be better to use ModelType from sequelize here, but this produces error ts(2684)
	Model: ModelSingleton;
	onModelCreated?: (actorId: null | string, modelId: string) => Promise<void | ActivityItem>;
	onModelUpdated?: (
		actorId: null | string,
		modelId: string,
		previousModel: InstanceProperties,
	) => Promise<void | ActivityItem>;
	onModelDestroyed?: (actorId: null | string, modelId: string) => Promise<void | ActivityItem>;
};

export const createActivityHooks = <InstanceProperties extends MinimalInstanceProperties>(
	options: CreateActivityHooksOptions<InstanceProperties>,
) => {
	const { Model, onModelCreated, onModelUpdated, onModelDestroyed } = options;
	if (onModelCreated) {
		Model.afterCreate((model, { actorId }) =>
			defer(async () => {
				await onModelCreated(actorId || null, model.id);
			}),
		);
	}
	if (onModelUpdated) {
		Model.afterUpdate((model, { actorId }) =>
			defer(async () => {
				const previousModel = { ...model._previousDataValues };
				await onModelUpdated(actorId || null, model.id, previousModel);
			}),
		);
	}
	if (onModelDestroyed) {
		Model.beforeDestroy(async (model, { actorId }) => {
			await onModelDestroyed(actorId || null, model.id);
		});
	}
};
