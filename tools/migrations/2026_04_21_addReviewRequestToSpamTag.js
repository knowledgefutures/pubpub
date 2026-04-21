/**
 * Add approval-request columns to SpamTags.
 *
 * These columns support the explicit "Request Approval" flow where community
 * admins can request that PubPub staff approve their community to make it
 * publicly visible.
 */

module.exports = async ({ Sequelize, sequelize }) => {
	const qi = sequelize.getQueryInterface();
	await qi.addColumn('SpamTags', 'approvalRequestedAt', {
		type: Sequelize.DATE,
		allowNull: true,
		defaultValue: null,
	});
	await qi.addColumn('SpamTags', 'approvalRequestMessage', {
		type: Sequelize.TEXT,
		allowNull: true,
		defaultValue: null,
	});
	await qi.addColumn('SpamTags', 'approvalRequestedByUserId', {
		type: Sequelize.UUID,
		allowNull: true,
		defaultValue: null,
		references: { model: 'Users', key: 'id' },
		onDelete: 'SET NULL',
	});
};
