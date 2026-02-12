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
