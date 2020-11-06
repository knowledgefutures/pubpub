import Bluebird from 'bluebird';

export const forEach = async (items, fn, concurrency) => {
	return Bluebird.map(items, fn, { concurrency: concurrency });
};

export const forEachInstance = async (Model, fn, concurrency) => {
	return forEach(await Model.findAll(), fn, concurrency);
};
