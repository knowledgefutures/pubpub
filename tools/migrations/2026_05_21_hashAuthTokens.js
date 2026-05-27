/**
 * Replace the plaintext `token` column on AuthTokens with a SHA-256 hash plus a
 * short `lastFour` display preview. Existing rows are dropped because the
 * plaintext is the only thing that could be hashed forward, and the feature has
 * not been in real use yet.
 */
export const up = async ({ Sequelize, sequelize }) => {
	await sequelize.query('DELETE FROM "AuthTokens";');

	await sequelize.queryInterface.removeColumn('AuthTokens', 'token');

	await sequelize.queryInterface.addColumn('AuthTokens', 'hashedToken', {
		type: Sequelize.TEXT,
		allowNull: false,
		unique: true,
	});

	await sequelize.queryInterface.addColumn('AuthTokens', 'lastFour', {
		type: Sequelize.STRING(8),
		allowNull: false,
	});
};

export const down = async ({ Sequelize, sequelize }) => {
	await sequelize.query('DELETE FROM "AuthTokens";');

	await sequelize.queryInterface.removeColumn('AuthTokens', 'hashedToken');
	await sequelize.queryInterface.removeColumn('AuthTokens', 'lastFour');

	await sequelize.queryInterface.addColumn('AuthTokens', 'token', {
		type: Sequelize.TEXT,
		unique: true,
		defaultValue: Sequelize.literal('gen_random_uuid()'),
	});
};
