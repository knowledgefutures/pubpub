// @ts-check

/**
 * one-time migration tool to import pubpub users into kf-auth.
 *
 * reads all users with valid password hashes (passwordDigest = 'sha512'),
 * formats them as pubpub:<salt>:<hash>, calls the kf-auth bulk import API,
 * and stores the returned authId in pubpub's Users table.
 *
 * the up function adds the authId column and then runs the import as a dry run.
 * use --fn upCommit to actually write to kf-auth and store authIds.
 *
 * usage:
 *   pnpm tools migrate --name 2026_05_07_migrate_to_kf_auth                  # dry run
 *   pnpm tools migrate --name 2026_05_07_migrate_to_kf_auth --fn upCommit    # actually write
 *   pnpm tools migrate --name 2026_05_07_migrate_to_kf_auth --down           # revert
 */
import { Op } from "sequelize";
import { User } from "server/models";
import { getKfSdk } from "server/kfAuth";

const BATCH_SIZE = 100;

const testUsers = ["hello@tefkah.com", "other@tefkah.com"];

const runImport = async ({ Sequelize, sequelize }, { commit }) => {
  try {
    await sequelize.queryInterface.addColumn("Users", "authId", {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: null,
    });
  } catch (error) {
    console.error("Error adding authId column:", error);
  }

  const stats = {
    total: 0,
    migrated: 0,
    skippedExisting: 0,
    skippedNoHash: 0,
    skippedSpam: 0,
    errors: 0,
  };

  console.log(`[migrate-to-kf-auth] mode: ${commit ? "COMMIT" : "DRY RUN"}`);

  // only migrate users who are not confirmed spam.
  // the literal subquery handles three cases:
  //   - user has no spamTagId at all (never evaluated)
  //   - user's spam tag is 'unreviewed' (benefit of the doubt)
  //   - user's spam tag is 'confirmed-not-spam'
  const users = await User.findAll({
    where: {
      authId: { [Op.is]: null },
      email: { [Op.in]: testUsers },
      //   [Op.or]: [
      //     { spamTagId: { [Op.is]: null } },
      //     sequelize.literal(
      //       `"User"."spamTagId" IN (SELECT "id" FROM "SpamTags" WHERE "status" IN ('confirmed-not-spam', 'unreviewed'))`
      //     ),
      //   ],
    },
    order: [["createdAt", "ASC"]],
  });

  stats.total = users.length;
  console.log(`[migrate-to-kf-auth] found ${users.length} eligible users without authId`);

  const kf = getKfSdk();

  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);

    const importPayload = batch.map((user) => {
      const hasHash = user.hash && user.salt && user.passwordDigest === "sha512";

      if (!hasHash) {
        stats.skippedNoHash++;
      }

      return {
        email: user.email,
        name: user.fullName || `${user.firstName} ${user.lastName}`,
        image: user.avatar,
        givenName: user.firstName,
        familyName: user.lastName,
        passwordHash: hasHash ? `pubpub:${user.salt}:${user.hash}` : "",
        emailVerified: true,
      };
    });

    if (!commit) {
      for (const payload of importPayload) {
        console.log(`[dry-run] would import: ${payload.email} (${payload.name})`);
        stats.migrated++;
      }
      continue;
    }

    try {
      const result = await kf.importUsers(importPayload);
      console.log(result);

      for (const entry of result.results) {
        const user = batch.find((u) => u.email === entry.email);

        if (!user) {
          continue;
        }

        if ((entry.status === "created" || entry.status === "exists") && entry.id) {
          await User.update({ authId: entry.id }, { where: { id: user.id } });

          if (entry.status === "created") {
            stats.migrated++;
          } else {
            stats.skippedExisting++;
          }
        } else if (entry.status === "error") {
          console.error(`[error] ${entry.email}: ${entry.error}`);
          stats.errors++;
        }
      }
    } catch (err) {
      console.error(`[error] batch import failed:`, err);
      stats.errors += importPayload.length;
    }
  }

  console.log(`\n[migrate-to-kf-auth] results:`);
  console.log(`  total users:     ${stats.total}`);
  console.log(`  migrated:        ${stats.migrated}`);
  console.log(`  already existed: ${stats.skippedExisting}`);
  console.log(`  no valid hash:   ${stats.skippedNoHash}`);
  console.log(`  errors:          ${stats.errors}`);

  if (!commit) {
    console.log(`\n  run with --fn upCommit to actually write changes`);
  }
};

export const up = (ctx) => runImport(ctx, { commit: false });

export const upCommit = (ctx) => runImport(ctx, { commit: true });

export const down = async ({ sequelize }) => {
  await sequelize.queryInterface.removeColumn("Users", "authId");
};
