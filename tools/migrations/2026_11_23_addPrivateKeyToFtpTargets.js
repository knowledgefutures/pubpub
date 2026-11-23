/**
 * Let an FTP target log in with an SSH private key instead of a password (Clarivate's MFT server
 * accepts keys only). The key is stored encrypted, like the password. Every read of FtpTargets
 * selects these columns, so they must exist before the code that declares them is live. This only
 * adds columns, so it is safe to run first, by hand if need be:
 *
 *   ALTER TABLE "FtpTargets" ADD COLUMN IF NOT EXISTS "privateKey" TEXT;
 *   ALTER TABLE "FtpTargets" ADD COLUMN IF NOT EXISTS "privateKeyInitVec" TEXT;
 *
 * Running it again after that does nothing.
 */
export const up = async ({ sequelize }) => {
	await sequelize.query('ALTER TABLE "FtpTargets" ADD COLUMN IF NOT EXISTS "privateKey" TEXT');
	await sequelize.query(
		'ALTER TABLE "FtpTargets" ADD COLUMN IF NOT EXISTS "privateKeyInitVec" TEXT',
	);
};

export const down = async ({ sequelize }) => {
	await sequelize.query('ALTER TABLE "FtpTargets" DROP COLUMN IF EXISTS "privateKeyInitVec"');
	await sequelize.query('ALTER TABLE "FtpTargets" DROP COLUMN IF EXISTS "privateKey"');
};
