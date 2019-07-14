/* eslint-disable no-console */
require('./setup');
const { Discussion } = require('../../server/models');

const main = async () => {
	const discussions = await Discussion.findAll({
		attributes: ['id', 'branchId', 'pubId'],
	});
	const branchIds = discussions
		.map((item) => {
			return { pubId: item.pubId, branchId: item.branchId };
		})
		.filter((item) => !!item.branchId)
		.map((item) => JSON.stringify(item));
	const uniqueBranchIds = [...new Set(branchIds)];
	uniqueBranchIds.forEach((id) => console.log(id));
};

main();
