/**
 * Replace Communities.issn with electronicIssn and printIssn. The columns must exist before the
 * code that reads them is live, since every page loads the community row. This only adds columns,
 * so it is safe to run first, by hand if need be:
 *
 *   ALTER TABLE "Communities" ADD COLUMN IF NOT EXISTS "electronicIssn" TEXT;
 *   ALTER TABLE "Communities" ADD COLUMN IF NOT EXISTS "printIssn" TEXT;
 *   UPDATE "Communities" SET "electronicIssn" = issn
 *     WHERE issn IS NOT NULL AND issn <> '' AND "electronicIssn" IS NULL;
 *
 * Running it again after that does nothing. The single issn column was never editable, so any
 * value in it was set by hand and is taken to be the electronic ISSN. Once the deploy is live,
 * the old column can be dropped by hand: ALTER TABLE "Communities" DROP COLUMN issn;
 */
export const up = async ({ sequelize }) => {
	await sequelize.query(
		'ALTER TABLE "Communities" ADD COLUMN IF NOT EXISTS "electronicIssn" TEXT',
	);
	await sequelize.query('ALTER TABLE "Communities" ADD COLUMN IF NOT EXISTS "printIssn" TEXT');
	await sequelize.query(
		`UPDATE "Communities" SET "electronicIssn" = issn
		WHERE issn IS NOT NULL AND issn <> '' AND "electronicIssn" IS NULL`,
	);
};

export const down = async ({ sequelize }) => {
	await sequelize.query('ALTER TABLE "Communities" DROP COLUMN IF EXISTS "printIssn"');
	await sequelize.query('ALTER TABLE "Communities" DROP COLUMN IF EXISTS "electronicIssn"');
};
