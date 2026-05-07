// @ts-check

/**
 * one-time migration tool to import pubpub users into kf-auth.
 *
 * reads all users with valid password hashes (passwordDigest = 'sha512'),
 * formats them as pubpub:<salt>:<hash>, calls the kf-auth bulk import API,
 * and stores the returned authId in pubpub's Users table.
 *
 * usage:
 *   pnpm tools migrations/migrate-to-kf-auth            # dry run
 *   pnpm tools migrations/migrate-to-kf-auth --commit   # actually write
 */
import { Op } from "sequelize";
import { SpamTag, User } from "server/models";
import { getKfSdk } from "server/kfAuth";
const BATCH_SIZE = 100;

// interface MigrationStats {
// 	total: number;
// 	migrated: number;
// 	skippedExisting: number;
// 	skippedNoHash: number;
// 	errors: number;
// }

export const up = async ({ Sequelize, sequelize }) => {
  await sequelize.queryInterface.addColumn("Users", "authId", {
    type: Sequelize.TEXT,
    allowNull: true,
    defaultValue: null,
  });

  const commit = process.argv.includes("--commit");
  const stats = {
    total: 0,
    migrated: 0,
    skippedExisting: 0,
    skippedNoHash: 0,
    errors: 0,
  };
  console.log(`[migrate-to-kf-auth] mode: ${commit ? "COMMIT" : "DRY RUN"}`);
  const users = await User.findAll({
    where: {
      authId: { [Op.is]: null },
    },
    include: [
      {
        model: SpamTag,
        as: "spamTag",
        where: { status: { [Op.in]: ["confirmed-not-spam", "unreviewed"] } },
        required: false,
      },
    ],
    order: [["createdAt", "ASC"]],
  });
  stats.total = users.length;

  console.log(`[migrate-to-kf-auth] found ${users.length} users without authId`);

  const kf = getKfSdk();
  const batches = [];

  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    batches.push(users.slice(i, i + BATCH_SIZE));
  }

  for (const batch of batches) {
    const importable = batch.filter((user) => {
      const hasValidHash = user.hash && user.salt && user.passwordDigest === "sha512";
      if (!hasValidHash) {
        stats.skippedNoHash++;
      }
      return true;
    });
    const importPayload = importable.map((user) => {
      const hasHash = user.hash && user.salt && user.passwordDigest === "sha512";
      return {
        email: user.email,
        name: user.fullName || `${user.firstName} ${user.lastName}`,
        givenName: user.firstName,
        familyName: user.lastName,
        // if no valid hash, import without password (user can reset via forgot-password)
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
      for (const entry of result.results) {
        if (entry.status === "created" && entry.id) {
          const user = batch.find((u) => u.email === entry.email);
          if (user) {
            await User.update({ authId: entry.id }, { where: { id: user.id } });
            stats.migrated++;
          }
        } else if (entry.status === "exists" && entry.id) {
          const user = batch.find((u) => u.email === entry.email);
          if (user) {
            await User.update({ authId: entry.id }, { where: { id: user.id } });
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
  console.log(`  already existed:  ${stats.skippedExisting}`);
  console.log(`  no valid hash:   ${stats.skippedNoHash}`);
  console.log(`  errors:          ${stats.errors}`);
  if (!commit) {
    console.log(`\n  run with --commit to actually write changes`);
  }
};
export const down = async () => {
  throw new Error("this migration is not reversible from here; clear authId manually if needed");
};
