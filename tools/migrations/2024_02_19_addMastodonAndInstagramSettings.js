// @ts-check

const newCommunityColumns = ['instagram', 'mastodon', 'linkedin', 'bluesky', 'github'];
const newUserColumns = ['mastodon', 'instagram', 'linkedin', 'bluesky'];

/**
 * @param {object} options
 * @param {import('sequelize').Sequelize} options.Sequelize
 * @param {import('server/sequelize').sequelize} options.sequelize
 */
export const up = async ({ Sequelize, sequelize }) => {
	const queryInterface = sequelize.getQueryInterface();

	const communityColumnsPromises = newCommunityColumns.map(async (column) => {
		const newCol = await queryInterface.addColumn('Communities', column, {
			// @ts-expect-error
			type: Sequelize.TEXT,
			defaultValue: null,
		});
		return newCol;
	});

	const userColumnsPromises = newUserColumns.map(async (column) => {
		const newCol = await queryInterface.addColumn('Users', column, {
			// @ts-expect-error
			type: Sequelize.TEXT,
			defaultValue: null,
		});
		return newCol;
	});

	const result = await Promise.allSettled([...communityColumnsPromises, ...userColumnsPromises]);

	result.forEach((promise) => {
		if (promise.status === 'rejected') {
			console.error(promise.reason);
		}
	});

	try {
		await queryInterface.addColumn('Communities', 'socialLinksLocation', {
			// @ts-expect-error
			type: Sequelize.ENUM('footer', 'header'),
			defaultValue: null,
		});
	} catch (error) {
		console.error(error);
	}
	console.log('Migration has been completed');
};

/**
 * @param {object} options
 * @param {import('server/sequelize').sequelize} options.sequelize
 */
export const down = async ({ sequelize }) => {
	const queryInterface = sequelize.getQueryInterface();

	const communityColumnsPromises = newCommunityColumns.map(async (column) => {
		const newCol = await queryInterface.removeColumn('Communities', column);
		return newCol;
	});

	const userColumnsPromises = newUserColumns.map(async (column) => {
		const newCol = await queryInterface.removeColumn('Users', column);
		return newCol;
	});

	const result = await Promise.allSettled([...communityColumnsPromises, ...userColumnsPromises]);

	result.forEach((promise) => {
		if (promise.status === 'rejected') {
			console.error(promise.reason);
		}
	});

	try {
		await queryInterface.removeColumn('Communities', 'socialLinksLocation');
	} catch (error) {
		console.error(error);
	}

	console.log('Migration has been completed');
};
