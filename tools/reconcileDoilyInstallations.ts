/**
 * Tell Doily which project each community's deposits already live in,
 * before the resolver stops guessing from the subdomain.
 *
 * PubPub used to find a community's Doily project by matching
 * `org.slug === community.subdomain`. Subdomains are editable, so after a rename
 * the match missed, provisioning treated the community as new, and a SECOND
 * project was created — future deposits landing there while the DOI history
 * stayed behind, under separate credentials and potentially a separate billing
 * account. The resolver now keys on an installation record against
 * `community.id`, and this run creates those records for communities that
 * predate it.
 *
 * The join key matters, and the obvious ones are all wrong:
 *
 *   - The CURRENT subdomain is what caused the bug. For a renamed community it
 *     resolves to the new, empty fork while every historical deposit sits under
 *     the old-slug project — cementing the fork instead of healing it.
 *   - kfOrgId over-groups: many communities legitimately share one KF org.
 *   - PubPub keeps no subdomain history, so the old slug is unrecoverable.
 *
 * What IS authoritative is where the deposits actually went:
 * `CrossrefDepositRecords.depositJson->'doily'` (`projectId` on newer records,
 * `organizationId` on everything deposited before the rename), written by
 * server/doi/queries.ts on every Doily deposit. This reads that, and falls back
 * to a subdomain match only for communities with no Doily deposit history at all
 * — where there is nothing to fork.
 *
 * A community whose deposits name two projects is already forked. That is
 * reported and skipped: picking a survivor means deciding which DOIs to orphan,
 * which is not a script's decision.
 *
 * DEPLOY ORDER MATTERS, and this run is the step that closes the window:
 *
 *   1. Deploy doily-a first, so /v1/installations exists. PubPub is still on the
 *      slug resolver at that point and keeps working — the reverse order breaks
 *      every Doily deposit, because fetchInstallation() throws on a 404.
 *   2. Deploy PubPub (migration + code).
 *   3. Run this with --execute IMMEDIATELY. Between 2 and 3, a community whose
 *      subdomain was renamed has no installation and no cached id, so the next
 *      deposit provisions by slug, finds no project carrying the NEW
 *      subdomain, and creates a second one — the very fork this replaces. A
 *      community that was never renamed is safe in that window, because
 *      provisioning adopts a project that already holds its slug.
 *
 * Only communities with the doilyDeposits flag on are exposed, and this run
 * enumerates exactly that set — so the window is small and knowable. If a fork
 * does happen in it, a later run reports the community as ALREADY FORKED.
 *
 *   pnpm run tools reconcileDoilyInstallations                    # dry run, every doily community
 *   pnpm run tools reconcileDoilyInstallations --subdomain demo   # dry run, one community
 *   pnpm run tools reconcileDoilyInstallations --execute          # write
 *
 * On prod use `tools-prod`, e.g.
 *   pnpm run tools-prod reconcileDoilyInstallations --execute
 */
import { Op } from 'sequelize';

import {
	DOILY_FLAG,
	installDoilyOrg,
	isDoilyConfigured,
	listDoilyProjects,
} from 'server/doily/client';
import { isFeatureFlagEnabledForUserInCommunity } from 'server/featureFlag/helpers';
import { getFeatureFlagByName } from 'server/featureFlag/queries';
import {
	Collection,
	Community,
	CrossrefDepositRecord,
	FeatureFlagCommunity,
	Pub,
} from 'server/models';

const log = (message: string) => console.log(`[reconcile-doily] ${message}`);
const warn = (message: string) => console.warn(`[reconcile-doily] WARN: ${message}`);

const getArgValue = (flag: string) => {
	const index = process.argv.indexOf(flag);
	return index === -1 ? null : (process.argv[index + 1] ?? null);
};

const execute = process.argv.includes('--execute');

/**
 * Communities the flag is on for, evaluated with the same helper production
 * uses: an explicit per-community override is the usual way it is enabled, but
 * enabledCommunitiesFraction can switch it on without any override row, and a
 * reconciliation that ignored that would silently skip those communities.
 */
const getDoilyCommunities = async (subdomain: string | null) => {
	const featureFlag = await getFeatureFlagByName(DOILY_FLAG);
	if (!featureFlag) {
		warn(`no ${DOILY_FLAG} feature flag exists in this environment`);
		return [];
	}
	const featureFlagCommunities = await FeatureFlagCommunity.findAll({
		where: { featureFlagId: featureFlag.id },
	});
	const explicitlyOnIds = featureFlagCommunities
		.filter((override) => override.enabled)
		.map((override) => override.communityId)
		.filter((id): id is string => Boolean(id));

	const where: Record<string, unknown> = {};
	if (subdomain) {
		where.subdomain = subdomain;
	} else if (!featureFlag.enabledCommunitiesFraction) {
		where.id = explicitlyOnIds;
	}

	const communities = await Community.findAll({
		where,
		attributes: ['id', 'subdomain', 'title', 'doilyOrgId'],
	});
	return communities.filter((community) =>
		isFeatureFlagEnabledForUserInCommunity({
			featureFlag,
			userId: null,
			communityId: community.id,
			featureFlagUsers: [],
			featureFlagCommunities,
		}),
	);
};

/**
 * Which Doily projects this community's own deposits went to, newest first. More
 * than one means the community is forked.
 *
 * The join runs through Pub and Collection because a deposit record belongs to a
 * work, not to a community directly — the same join the status backfill uses.
 */
const getDepositedProjectIds = async (communityId: string): Promise<Map<string, number>> => {
	const [pubs, collections] = await Promise.all([
		Pub.findAll({ where: { communityId }, attributes: ['crossrefDepositRecordId'] }),
		Collection.findAll({ where: { communityId }, attributes: ['crossrefDepositRecordId'] }),
	]);
	const recordIds = [...pubs, ...collections]
		.map((row) => row.crossrefDepositRecordId)
		.filter((id): id is string => Boolean(id));

	const counts = new Map<string, number>();
	if (!recordIds.length) {
		return counts;
	}

	const records = await CrossrefDepositRecord.findAll({
		where: { id: { [Op.in]: recordIds } },
		attributes: ['id', 'depositJson'],
	});
	for (const record of records) {
		// BOTH keys, and this is the load-bearing detail of the whole run. These
		// blobs are historical: every record deposited before Doily renamed the
		// level carries `organizationId`, and only records written afterwards carry
		// `projectId`. Reading just the current name would find nothing for exactly
		// the communities that have the longest history — which are the ones most
		// likely to have forked, and the reason this tool exists.
		const deposited = record.depositJson as {
			doily?: { projectId?: unknown; organizationId?: unknown };
		} | null;
		const projectId = deposited?.doily?.projectId ?? deposited?.doily?.organizationId;
		if (typeof projectId === 'string' && projectId) {
			counts.set(projectId, (counts.get(projectId) ?? 0) + 1);
		}
	}
	return counts;
};

const main = async () => {
	if (!isDoilyConfigured()) {
		warn('DOILY_URL / DOILY_API_TOKEN are unset — nothing to reconcile');
		return;
	}
	if (!execute) {
		log('DRY RUN — pass --execute to write. No installation will be created.');
	}

	const communities = await getDoilyCommunities(getArgValue('--subdomain'));
	log(`${communities.length} communities have ${DOILY_FLAG} enabled`);
	if (!communities.length) {
		return;
	}

	// Only fetched if some community has no deposit history to key on.
	let projectsBySlug: Map<string, string> | null = null;
	const getProjectsBySlug = async () => {
		if (!projectsBySlug) {
			const projects = await listDoilyProjects();
			projectsBySlug = new Map(projects.map((project) => [project.slug, project.id]));
		}
		return projectsBySlug;
	};

	const forked: string[] = [];
	const disagreed: string[] = [];
	let installed = 0;
	let alreadyCached = 0;
	let noEvidence = 0;

	for (const community of communities) {
		const label = `${community.subdomain} (${community.id})`;

		if (community.doilyOrgId) {
			alreadyCached += 1;
			continue;
		}

		// biome-ignore lint/performance/noAwaitInLoops: one community at a time keeps the report readable and the write load gentle
		const deposited = await getDepositedProjectIds(community.id);

		let projectId: string | null = null;
		if (deposited.size > 1) {
			const detail = [...deposited.entries()]
				.map(([id, count]) => `${id} (${count} deposits)`)
				.join(', ');
			warn(`${label} is ALREADY FORKED across ${detail} — skipping, needs a human`);
			forked.push(label);
			continue;
		}
		if (deposited.size === 1) {
			projectId = [...deposited.keys()][0]!;
			// The fork detector: the subdomain-derived answer disagreeing with the
			// deposit-derived one is exactly the rename case, and the deposits win.
			// biome-ignore lint/performance/noAwaitInLoops: fetched at most once, memoized above
			const bySlug = await getProjectsBySlug();
			const bySubdomain = bySlug.get(community.subdomain);
			if (bySubdomain && bySubdomain !== projectId) {
				warn(
					`${label} would have resolved to ${bySubdomain} by subdomain but its deposits are in ${projectId} — using the deposits`,
				);
				disagreed.push(label);
			}
		} else {
			// No Doily deposits: nothing can be forked, so the subdomain is safe to
			// trust. Absent a match there is nothing to reconcile either — the next
			// deposit provisions it.
			// biome-ignore lint/performance/noAwaitInLoops: fetched at most once, memoized above
			const bySlug = await getProjectsBySlug();
			projectId = bySlug.get(community.subdomain) ?? null;
			if (!projectId) {
				noEvidence += 1;
				log(`${label}: no deposits and no project — will provision on first deposit`);
				continue;
			}
		}

		log(`${label} -> ${projectId}${execute ? '' : ' (dry run)'}`);
		if (execute) {
			// biome-ignore lint/performance/noAwaitInLoops: one install per community, and a failure should stop the run rather than fan out
			await installDoilyOrg({ communityId: community.id, projectId: projectId });
			// biome-ignore lint/performance/noAwaitInLoops: paired with the install above
			await Community.update({ doilyOrgId: projectId }, { where: { id: community.id } });
		}
		installed += 1;
	}

	log('---');
	log(`${installed} ${execute ? 'installed' : 'would be installed'}`);
	log(`${alreadyCached} already had doilyOrgId cached`);
	log(`${noEvidence} have no Doily project yet`);
	if (disagreed.length) {
		warn(`${disagreed.length} renamed community/communities detected: ${disagreed.join(', ')}`);
	}
	if (forked.length) {
		warn(`${forked.length} ALREADY FORKED, skipped: ${forked.join(', ')}`);
		warn('Each needs a decision about which project keeps the DOIs.');
	}
};

main().then(
	() => process.exit(0),
	(err) => {
		console.error(err);
		process.exit(1);
	},
);
