/**
 * Rename Communities.kfOrgId to kfAccountId, and its indexes to match. In the KF
 * console these are accounts (billing entities); "org" is the old name.
 *
 * Run AFTER 2026_10_05_makeKfOrgIdNullable, which still operates on kfOrgId:
 *   pnpm tools migrate --name 2026_10_05_makeKfOrgIdNullable
 *   pnpm tools migrate --name 2026_10_05_renameKfOrgIdToKfAccountId
 * To roll back, run them down in reverse order.
 *
 * Two indexes may exist on the column: communities_kf_org_id_idx from
 * 2026_05_15_addKfOrgIdToCommunities, and communities_kf_org_id, which
 * sequelize.sync() added from the model's old @Index. The model no longer
 * declares the index (sync would try to create it on kfAccountId before this
 * migration runs), so both are renamed here, whichever exist.
 */

const indexRenames = [
	['communities_kf_org_id_idx', 'communities_kf_account_id_idx'],
	['communities_kf_org_id', 'communities_kf_account_id'],
];

export const up = async ({ sequelize }) => {
	await sequelize.transaction(async (transaction) => {
		await sequelize.queryInterface.renameColumn('Communities', 'kfOrgId', 'kfAccountId', {
			transaction,
		});
		for (const [from, to] of indexRenames) {
			await sequelize.query(`ALTER INDEX IF EXISTS "${from}" RENAME TO "${to}"`, {
				transaction,
			});
		}
	});
};

export const down = async ({ sequelize }) => {
	await sequelize.transaction(async (transaction) => {
		await sequelize.queryInterface.renameColumn('Communities', 'kfAccountId', 'kfOrgId', {
			transaction,
		});
		for (const [from, to] of indexRenames) {
			await sequelize.query(`ALTER INDEX IF EXISTS "${to}" RENAME TO "${from}"`, {
				transaction,
			});
		}
	});
};
