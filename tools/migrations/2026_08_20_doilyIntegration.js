/**
 * The whole PubPub side of the Doily integration, in one migration.
 *
 * Squashes three that were only ever going to be applied together:
 *   2026_08_13_addDepositStateToCrossrefDepositRecords
 *   2026_08_18_addDoilyOrgIdToCommunities
 *   2026_08_20_renameDoilyProjectIdOnCommunities
 * The third only renamed a column the second had just added, so the net effect is
 * to add `doilyProjectId` under its real name and never mention the old one.
 *
 * THE SQL FILE NEXT TO THIS ONE IS THE SUPPORTED PATH. Run it with psql. This
 * wrapper exists so the migration list stays truthful about what happened to the
 * schema, and it delegates to the same file so the two cannot drift.
 *
 * The reason to prefer psql: tools/migrate.js calls sequelize.sync() before every
 * migration, which creates indexes declared by @Index decorators on the models.
 * That is how the index on the old column ended up named `communities_doily_org_id`
 * rather than the name the 08_18 migration asked for, and with the model now
 * declaring `doilyProjectId`, sync reaches for an index on a column this migration
 * has not created yet.
 *
 * Every statement in the SQL is idempotent, so running it against a database in
 * any of the three states it might be in (nothing applied, 08_13 and 08_18
 * applied, everything applied) converges on the same schema.
 */
const fs = require('fs');
const path = require('path');

const sqlPath = path.join(__dirname, '2026_08_20_doilyIntegration.sql');

export const up = async ({ sequelize }) => {
	await sequelize.query(fs.readFileSync(sqlPath, 'utf8'));
};

/**
 * No down. The columns hold the only record of which Doily deposit a
 * CrossrefDepositRecord became and when its DOI first registered, and dropping
 * them discards state that lives nowhere else in PubPub. The three superseded
 * migrations still carry their own `down` in git history if a column genuinely
 * has to come off.
 */
export const down = async () => {
	throw new Error(
		'No down migration: dropping these columns discards deposit state that exists nowhere else',
	);
};
