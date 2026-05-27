/**
 * Phase D cleanup: Remove password-related columns from Users table.
 *
 * After the 30-day transition period, all users authenticate via KF Auth.
 * These columns are no longer needed in PubPub's database.
 *
 * Run this ONLY after confirming all old sessions have expired and
 * the OIDC login flow is working reliably.
 */

export const up = async ({ Sequelize, sequelize }) => {
	const qi = sequelize.queryInterface;

	// Remove password-related columns
	await qi.removeColumn('Users', 'hash');
	await qi.removeColumn('Users', 'salt');
	await qi.removeColumn('Users', 'passwordDigest');
	await qi.removeColumn('Users', 'sha3hashedPassword');
	await qi.removeColumn('Users', 'resetHash');
	await qi.removeColumn('Users', 'resetHashExpiration');
};

export const down = async ({ Sequelize, sequelize }) => {
	const qi = sequelize.queryInterface;

	// Restore password-related columns (data is gone though)
	await qi.addColumn('Users', 'hash', { type: Sequelize.TEXT });
	await qi.addColumn('Users', 'salt', { type: Sequelize.TEXT });
	await qi.addColumn('Users', 'passwordDigest', { type: Sequelize.TEXT });
	await qi.addColumn('Users', 'sha3hashedPassword', { type: Sequelize.TEXT });
	await qi.addColumn('Users', 'resetHash', { type: Sequelize.TEXT });
	await qi.addColumn('Users', 'resetHashExpiration', {
		type: Sequelize.DATE,
	});
};
