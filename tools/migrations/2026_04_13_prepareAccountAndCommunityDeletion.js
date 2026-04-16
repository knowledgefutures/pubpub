/**
 * Prepare schema for account and community deletion features.
 *
 * 1. Change onDelete behavior for user-referencing FKs on scholarly records
 *    from CASCADE to SET NULL (for attributions with backup fields) or
 *    NO ACTION (for all others — these will be reassigned to a sentinel user
 *    before deletion).
 * 2. Seed the sentinel "[Deleted User]" system account.
 * 3. Seed the "PubPub Archive" community at archive.pubpub.org.
 */

const DELETED_USER_ID = '00000000-0000-0000-0000-000000000000';
const ARCHIVE_COMMUNITY_ID = '00000000-0000-0000-0000-000000000001';
const ARCHIVE_HOME_PAGE_ID = '00000000-0000-0000-0000-000000000002';

/**
 * Helper: alter a FK constraint's onDelete behavior.
 * Drops the existing constraint and recreates it with the new behavior.
 */
const alterFkOnDelete = async (queryInterface, { table, column, references, onDelete, constraintName }) => {
  const name = constraintName || `${table}_${column}_fkey`;
  await queryInterface.sequelize.query(`
    ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${name}";
  `);
  await queryInterface.sequelize.query(`
    ALTER TABLE "${table}"
      ADD CONSTRAINT "${name}"
      FOREIGN KEY ("${column}")
      REFERENCES "${references.table}" ("${references.key}")
      ON DELETE ${onDelete}
      ON UPDATE CASCADE;
  `);
};

const FK_CHANGES = [
  // PubAttribution.userId: CASCADE → SET NULL
  { table: 'PubAttributions', column: 'userId', references: { table: 'Users', key: 'id' }, newOnDelete: 'SET NULL', oldOnDelete: 'CASCADE' },
  // CollectionAttribution.userId: CASCADE → SET NULL
  { table: 'CollectionAttributions', column: 'userId', references: { table: 'Users', key: 'id' }, newOnDelete: 'SET NULL', oldOnDelete: 'CASCADE' },
  // Discussion.userId: CASCADE → NO ACTION (reassigned to sentinel before user deletion)
  { table: 'Discussions', column: 'userId', references: { table: 'Users', key: 'id' }, newOnDelete: 'NO ACTION', oldOnDelete: 'CASCADE' },
  // ThreadComment.userId: CASCADE → NO ACTION (reassigned to sentinel before user deletion)
  { table: 'ThreadComments', column: 'userId', references: { table: 'Users', key: 'id' }, newOnDelete: 'NO ACTION', oldOnDelete: 'CASCADE' },
  // ThreadEvent.userId: CASCADE → NO ACTION (will be reassigned to sentinel before user deletion)
  { table: 'ThreadEvents', column: 'userId', references: { table: 'Users', key: 'id' }, newOnDelete: 'NO ACTION', oldOnDelete: 'CASCADE' },
  // ReviewEvent.userId: CASCADE → NO ACTION (will be reassigned to sentinel before user deletion)
  { table: 'ReviewEvents', column: 'userId', references: { table: 'Users', key: 'id' }, newOnDelete: 'NO ACTION', oldOnDelete: 'CASCADE' },
  // NOTE: ReviewNew.userId is intentionally unconstrained at the DB level
  // (model sets constraints: false). We skip it here — destroyUser handles
  // reassignment to the sentinel user before deleting the User row, so
  // no DB-level FK enforcement is needed.
  // CommunityBan.actorId: CASCADE → NO ACTION (reassigned to sentinel before user deletion)
  { table: 'CommunityBans', column: 'actorId', references: { table: 'Users', key: 'id' }, newOnDelete: 'NO ACTION', oldOnDelete: 'CASCADE' },
];

export const up = async (queryInterface) => {
  // 1. Seed the sentinel "[Deleted User]" system account FIRST — we need it
  //    as a target for orphaned userId references before re-adding FK constraints.
  await queryInterface.sequelize.query(`
    INSERT INTO "Users" (
      id, slug, "firstName", "lastName", "fullName", initials, email,
      hash, salt, "isSuperAdmin", "gdprConsent", "createdAt", "updatedAt"
    ) VALUES (
      '${DELETED_USER_ID}',
      'deleted-user',
      'Deleted',
      'User',
      'Deleted User',
      'DU',
      'deleted@pubpub.org',
      '',
      '',
      false,
      false,
      NOW(),
      NOW()
    ) ON CONFLICT (id) DO NOTHING;
  `);

  // 2. Clean up orphaned userId/actorId references.
  //    Production data may have rows pointing to deleted users (prior manual
  //    deletions, etc.). The old CASCADE constraint would have cleaned these up
  //    on user delete, but if the constraint was dropped or the deletion was
  //    done outside the ORM, orphans can remain. We must fix them before
  //    ADD CONSTRAINT, which validates all existing rows.
  for (const fk of FK_CHANGES) {
    if (fk.newOnDelete === 'SET NULL') {
      // For attributions: NULL out orphaned userId references
      await queryInterface.sequelize.query(`
        UPDATE "${fk.table}"
        SET "${fk.column}" = NULL
        WHERE "${fk.column}" IS NOT NULL
          AND "${fk.column}" NOT IN (SELECT "id" FROM "${fk.references.table}");
      `);
    } else {
      // For NO ACTION tables: reassign orphans to the sentinel user
      await queryInterface.sequelize.query(`
        UPDATE "${fk.table}"
        SET "${fk.column}" = '${DELETED_USER_ID}'
        WHERE "${fk.column}" IS NOT NULL
          AND "${fk.column}" NOT IN (SELECT "id" FROM "${fk.references.table}");
      `);
    }
  }

  // 3. Alter FK onDelete behaviors (now safe — no orphaned references)
  for (const fk of FK_CHANGES) {
    await alterFkOnDelete(queryInterface, {
      table: fk.table,
      column: fk.column,
      references: fk.references,
      onDelete: fk.newOnDelete,
    });
  }

  // 4. Seed the "PubPub Archive" community with a confirmed-not-spam SpamTag.
  //    Without a SpamTag marked 'confirmed-not-spam', the community may be
  //    blocked by the spam gating check in initData.ts.
  await queryInterface.sequelize.query(`
    DO $$
    DECLARE
      spam_tag_id UUID := gen_random_uuid();
    BEGIN
      -- Create SpamTag first
      INSERT INTO "SpamTags" (
        id, status, "statusUpdatedAt", fields, "spamScore",
        "spamScoreComputedAt", "spamScoreVersion", "createdAt", "updatedAt"
      ) VALUES (
        spam_tag_id,
        'confirmed-not-spam',
        NOW(),
        '{}'::jsonb,
        0,
        NOW(),
        1,
        NOW(),
        NOW()
      );
      -- Create or update the archive community with the SpamTag
      INSERT INTO "Communities" (
        id, subdomain, title, description, "spamTagId",
        "accentColorLight", "accentColorDark", "headerColorType",
        "hideHero", "hideNav",
        "createdAt", "updatedAt"
      ) VALUES (
        '${ARCHIVE_COMMUNITY_ID}',
        'archive',
        'PubPub Archive',
        'Archived publications from deleted PubPub communities. These pages are maintained to preserve the scholarly record.',
        spam_tag_id,
        '#FFFFFF',
        '#112233',
        'dark',
        true,
        true,
        NOW(),
        NOW()
      ) ON CONFLICT (id) DO UPDATE SET "spamTagId" = spam_tag_id, "accentColorLight" = '#FFFFFF', "accentColorDark" = '#112233', "headerColorType" = 'dark', "hideHero" = true, "hideNav" = true;

      -- Create or update the home page
      INSERT INTO "Pages" (
        id, title, slug, description, "isPublic", layout, "communityId",
        "createdAt", "updatedAt"
      ) VALUES (
        '${ARCHIVE_HOME_PAGE_ID}',
        'Home',
        '',
        'PubPub Archive home page',
        true,
        '[{"id":"0","type":"html","content":{"html":"<div style=\"max-width:640px;margin:2em auto;font-size:1.1em;line-height:1.6\"><p>This is the PubPub Archive community. Pubs from deleted communities that need to be preserved for the scholarly record will be kept here for preservation.</p></div>"}}]'::jsonb,
        '${ARCHIVE_COMMUNITY_ID}',
        NOW(),
        NOW()
      ) ON CONFLICT (id) DO UPDATE SET
        layout = EXCLUDED.layout,
        "isPublic" = true;

      -- Point the community navigation at the home page
      UPDATE "Communities"
        SET navigation = '[{"type":"page","id":"${ARCHIVE_HOME_PAGE_ID}"}]'::jsonb
        WHERE id = '${ARCHIVE_COMMUNITY_ID}';
    END $$;
  `);
};

export const down = async (queryInterface) => {
  // 1. Remove seeded archive community
  await queryInterface.sequelize.query(`
    DELETE FROM "Communities" WHERE id = '${ARCHIVE_COMMUNITY_ID}';
  `);

  // 2. Remove seeded sentinel user
  await queryInterface.sequelize.query(`
    DELETE FROM "Users" WHERE id = '${DELETED_USER_ID}';
  `);

  // 3. Revert FK onDelete behaviors
  for (const fk of FK_CHANGES) {
    await alterFkOnDelete(queryInterface, {
      table: fk.table,
      column: fk.column,
      references: fk.references,
      onDelete: fk.oldOnDelete,
    });
  }
};
