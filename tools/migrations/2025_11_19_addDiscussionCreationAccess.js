// @ts-check

const { Sequelize } = require('sequelize');

/**
 * @param {object} options
 * @param {import('sequelize').Sequelize} options.Sequelize
 * @param {import('server/sequelize').sequelize} options.sequelize
 */
export const up = async ({ sequelize }) => {
	await sequelize.getQueryInterface().addColumn('PublicPermissions', 'discussionCreationAccess', {
		// @ts-expect-error
		type: Sequelize.ENUM('public', 'contributors-members', 'disabled'),
		defaultValue: 'public',
		allowNull: false,
	});

	// for each already existing PublicPermissions, set the discussionCreationAccess to the value of the PublicPermissions
	/** @type {import('server/publicPermissions/model').PublicPermissions[]} */
	// @ts-expect-error yeah yeah
	const publicPermissions = await sequelize.models.PublicPermissions.findAll();

	await Promise.all(
		publicPermissions.map(async (publicPermission) => {
			return publicPermission.update({
				discussionCreationAccess:
					publicPermission.canCreateDiscussions === false ? 'disabled' : 'public',
			});
		}),
	);
};

/**
 * @param {object} options
 * @param {import('server/sequelize').sequelize} options.sequelize
 */
export const down = async ({ sequelize }) => {
	await sequelize
		.getQueryInterface()
		.removeColumn('PublicPermissions', 'discussionCreationAccess');
};
