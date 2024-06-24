// @ts-check

const { asyncMap } = require('utils/async');
const { Op } = require('sequelize');

/**
 * @param {object} options
 * @param {import('sequelize').Sequelize} options.Sequelize
 * @param {import('server/sequelize').sequelize} options.sequelize
 */
export const up = async ({ sequelize }) => {
	const communitiesWithLinkedin = await sequelize.models.Community.findAll({
		where: {
			linkedin: {
				[Op.not]: null,
			},
		},
	});
	console.log(communitiesWithLinkedin);
	console.log(`Found ${communitiesWithLinkedin.length} communities with linkedin defined`);

	const updatedCommunities = await asyncMap(
		communitiesWithLinkedin,
		async (community) =>
			community.update({
				// @ts-expect-error linkedin does exist
				linkedin: `in/${community.linkedin}`,
			}),
		{ concurrency: 20 },
	);

	console.log(`Updated ${updatedCommunities.length} communities!`);

	const usersWithLinkedin = await sequelize.models.User.findAll({
		where: {
			linkedin: {
				[Op.not]: null,
			},
		},
	});
	console.log(`Found ${usersWithLinkedin.length} users with linkedin defined`);

	const updatedUsers = await asyncMap(
		usersWithLinkedin,
		async (user) =>
			user.update({
				// @ts-expect-error linkedin does exist
				linkedin: `https://www.linkedin.com/in/${user.linkedin}`,
			}),
		{ concurrency: 20 },
	);
	console.log(`Updated ${updatedUsers.length} users!`);

	console.log('Migration has been completed');
};

/**
 * @param {object} options
 * @param {import('server/sequelize').sequelize} options.sequelize
 */
export const down = async ({ sequelize }) => {
	const communitiesWithLinkedin = await sequelize.models.Community.findAll({
		where: {
			linkedin: {
				[Op.not]: null,
			},
		},
	});
	console.log(`Found ${communitiesWithLinkedin.length} communities with linkedin defined`);

	const updatedCommunities = await asyncMap(
		communitiesWithLinkedin,
		async (community) =>
			community.update({
				// @ts-expect-error linkedin does exist
				linkedin: community.linkedin.replace('in/', ''),
			}),
		{ concurrency: 20 },
	);

	console.log(`Reverted ${updatedCommunities.length} communities!`);

	const usersWithLinkedin = await sequelize.models.User.findAll({
		where: {
			linkedin: {
				[Op.not]: null,
			},
		},
	});
	console.log(`Found ${usersWithLinkedin.length} users with linkedin defined`);

	const updatedUsers = await asyncMap(
		usersWithLinkedin,
		async (user) =>
			user.update({
				// @ts-expect-error linkedin does exist
				linkedin: user.linkedin.replace('https://www.linkedin.com/in/', ''),
			}),
		{ concurrency: 20 },
	);
	console.log(`Reverted ${updatedUsers.length} users!`);

	console.log('Migration reversion has been completed');
};
