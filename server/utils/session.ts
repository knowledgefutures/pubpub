import { sequelize } from 'server/sequelize';

/**
 * Deletes all non-expired sessions for a user from the Sessions table.
 * Session data stores passport user id at data.passport.user (serialized by passport).
 * Only unexpired sessions are deleted; expired ones are left for the store's cleanup.
 */
export const deleteSessionsForUser = async (email: string): Promise<void> => {
	const result = await sequelize.query(
		`DELETE FROM "Sessions"
		 WHERE "expires" > NOW()
		 AND (data::jsonb->'passport'->>'user') = :email`,
		{ replacements: { email } },
	);
	console.log(
		`Deleted ${(result[1] as { rowCount: number }).rowCount} sessions for user ${email}`,
	);
};

/**
 * Deletes the session(s) created from a specific kf-auth session.
 * The OIDC callback stamps `kfSessionId` (the ID token's `sid` claim)
 * onto the session, so a kf-auth `session.revoked` webhook can end
 * exactly the local sessions that belonged to it.
 */
export const deleteSessionsByKfSessionId = async (kfSessionId: string): Promise<number> => {
	const result = await sequelize.query(
		`DELETE FROM "Sessions"
		 WHERE "expires" > NOW()
		 AND (data::jsonb->>'kfSessionId') = :kfSessionId`,
		{ replacements: { kfSessionId } },
	);
	const count = (result[1] as { rowCount: number }).rowCount;
	console.log(`Deleted ${count} sessions for kf-auth session ${kfSessionId}`);
	return count;
};
