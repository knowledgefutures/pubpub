import { asyncMap } from 'utils/async';

export const forEach = async (items, fn, concurrency = 1) => {
	return asyncMap(items, fn, { concurrency });
};

export const forEachInstance = async (
	Model,
	fn,
	concurrency = 1,
	order = [['createdAt', 'DESC']],
) => {
	return forEach(await Model.findAll({ order }), fn, concurrency);
};
