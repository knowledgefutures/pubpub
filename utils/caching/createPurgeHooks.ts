import type { Attributes, CreateOptions, DestroyOptions, UpdateOptions } from 'sequelize';
import type { Model, ModelCtor } from 'sequelize-typescript';
import { defer } from 'server/utils/deferred';
import { schedulePurge } from './schedulePurgeWithSentry';
import { shouldntPurge } from './skipPurgeConditions';

const deferPurge =
	<M extends Model<any, any>>(
		func: (instance: M, options?: any) => Promise<string | string[] | null | undefined | void>,
	) =>
	(instance: any, options: any) => {
		// mostly here to prematurely prevent purges during tests which don't need them
		// otherwise tons of deferred tasks get created, which makes tests take forever and
		// possibly cause stackoverflows in heroku
		if (shouldntPurge('true')) {
			return;
		}

		defer(async () => {
			const key = await func(instance, options);
			if (!key) {
				return;
			}
			if (Array.isArray(key)) {
				await Promise.all(key.map((k) => schedulePurge(k)));
				return;
			}
			await schedulePurge(key);
		});
	};

type PurgeHook<
	M extends ModelCtor,
	T extends 'afterCreate' | 'afterDestroy' | 'afterUpdate',
	I extends InstanceType<M> = InstanceType<M>,
	A extends Attributes<I> = Attributes<I>,
> = (
	instance: InstanceType<M>,
	options?: T extends 'afterCreate'
		? CreateOptions<A>
		: T extends 'afterUpdate'
		  ? UpdateOptions<A>
		  : DestroyOptions<A>,
) => Promise<string | string[] | null | undefined | void>;

export const createPurgeHooks = <M extends ModelCtor>(options: {
	model: M;
	onModelCreated?: PurgeHook<M, 'afterCreate'>;
	/**
	 * Only runs by default on <instance>.update(), not on <Model>.update()
	 *
	 * If this isn't running, be sure to check that you have `{individualHooks: true}` in your
	 * `Model.update` call.
	 */
	onModelUpdated?: PurgeHook<M, 'afterUpdate'>;
	/**
	 * Only runs by default on <instance>.update(), not on <Model>.update()
	 *
	 * If this isn't running, be sure to check that you have `{individualHooks: true}` in your
	 * `Model.destroy` call.
	 */
	onModelDestroyed?: PurgeHook<M, 'afterDestroy'>;
}) => {
	const { model, onModelCreated, onModelUpdated, onModelDestroyed } = options;
	if (onModelCreated) {
		model.afterCreate(deferPurge(onModelCreated));
	}
	if (onModelUpdated) {
		model.afterUpdate(deferPurge(onModelUpdated));
	}
	if (onModelDestroyed) {
		model.afterDestroy(deferPurge(onModelDestroyed));
	}
};
