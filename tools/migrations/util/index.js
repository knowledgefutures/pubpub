import Bluebird from 'bluebird';

export const forEach = async (items, fn, concurrency = 1) => {
	return Bluebird.map(items, fn, { concurrency: concurrency });
};

export const forEachInstance = async (Model, fn, concurrency = 1) => {
	return forEach(await Model.findAll(), fn, concurrency);
};
