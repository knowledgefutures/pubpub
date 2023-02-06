/* global expect */
import { Op } from 'sequelize';

import { ActivityItem } from 'server/models';
import { finishDeferredTasks } from 'server/utils/deferred';
import * as types from 'types';

type ExpectCreatedActivityItemResult<Result> = {
	toMatchResultingObject: (
		values: (result: Result) => types.DeepPartial<types.ActivityItem>,
	) => Promise<Result>;
	toMatchObject: (values: types.DeepPartial<types.ActivityItem>) => Promise<Result>;
};

const splitQueryFromAssertion = (result: Record<string, any>) => {
	const { communityId, collectionId, pubId, kind, ...assertion } = result;
	const query = { communityId, collectionId, pubId, kind };
	Object.keys(query).forEach((key) => {
		if (!query[key]) {
			delete query[key];
		}
	});
	return { query, assertion };
};

export const expectCreatedActivityItem = <Result = Record<string, any>>(
	promise: Promise<Result>,
): ExpectCreatedActivityItemResult<Result> => {
	const cutoffTime = new Date();
	return {
		toMatchResultingObject: async (responseFn) => {
			const result = await promise;
			await finishDeferredTasks();
			const resolvedValues = responseFn(result);
			const { query, assertion } = splitQueryFromAssertion(resolvedValues);
			const item = await ActivityItem.findOne({
				where: { ...query, createdAt: { [Op.gte]: cutoffTime } },
			});
			expect(item).toMatchObject(assertion);
			return result;
		},
		toMatchObject: async (values) => {
			const result = await promise;
			await finishDeferredTasks();
			const { query, assertion } = splitQueryFromAssertion(values);
			const item = await ActivityItem.findOne({
				where: { ...query, createdAt: { [Op.gte]: cutoffTime } },
			});
			expect(item).toMatchObject(assertion);
			return result;
		},
	};
};
