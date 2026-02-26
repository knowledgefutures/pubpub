import fs from 'fs';

import { findPub, setDoiData } from 'server/doi/queries';
import { CrossrefDepositRecord, PubEdge } from 'server/models';
import { createPubEdge, destroyPubEdge } from 'server/pubEdge/queries';
import { withTransaction } from 'server/transactionContext';
import { getDepositRecordReviewType } from 'utils/crossref/parseDeposit';
import { findParentEdgeByRelationTypes, RelationType } from 'utils/pubEdge/relations';

import {
	applyRange,
	checkDoiInCrossref,
	createLogger,
	getInputPath,
	waitForDoiResolution,
	writeResults,
} from './shared';

type FailureEntry = {
	working: boolean;
	doi: string;
	pub: string;
	slug: string;
	id: string;
	error: string;
	time: string;
};

type SavedEdge = {
	pubId: string;
	targetPubId: string;
	relationType: string;
	pubIsParent: boolean;
	approvedByTarget: boolean;
	rank: string;
};

type PubInfo = {
	id: string;
	title: string;
	doi: string | null;
	slug: string;
	communityId: string;
	reviewType: string | null;
};

type Cluster = {
	parent: PubInfo;
	children: PubInfo[];
	edges: SavedEdge[];
};

type ResultEntry = {
	id: string;
	title: string;
	doi: string | null;
	slug: string;
	role: 'parent' | 'child' | 'standalone';
	success: boolean;
	error?: string;
	cluster?: string;
};

const dryRun = process.argv.includes('--dry-run');
const logger = createLogger('fix-dois');
const { log, warn, error: logErr } = logger;

const extractReviewType = async (pub: any): Promise<string | null> => {
	if (!pub.crossrefDepositRecordId) {
		return null;
	}
	const record = await CrossrefDepositRecord.findByPk(pub.crossrefDepositRecordId);
	if (!record) {
		return null;
	}
	return getDepositRecordReviewType(record) ?? null;
};

const getSupplementEdgesForChild = (pub: any): any[] => {
	const outbound = (pub.outboundEdges ?? []).filter(
		(e: any) => e.relationType === 'supplement' && !e.pubIsParent && e.targetPubId,
	);
	const inbound = (pub.inboundEdges ?? []).filter(
		(e: any) => e.relationType === 'supplement' && e.pubIsParent && e.pubId,
	);
	return [...outbound, ...inbound];
};

const getReviewTargetDoi = (pub: any): string | null => {
	const edge = findParentEdgeByRelationTypes(pub, [RelationType.Review, RelationType.Rejoinder]);
	if (!edge) {
		return null;
	}
	if (edge.externalPublication?.doi) {
		return edge.externalPublication.doi;
	}
	const targetPub = edge.pubIsParent ? edge.pub : edge.targetPub;
	return targetPub?.doi ?? null;
};

async function discoverClusters(pubIds: string[]): Promise<{
	clusters: Cluster[];
	standalone: PubInfo[];
}> {
	log(`fetching ${pubIds.length} pubs from database...`);
	const pubs = new Map<string, any>();
	const fetched = await Promise.all(pubIds.map(async (id) => ({ id, pub: await findPub(id) })));
	for (const { id, pub } of fetched) {
		if (!pub) {
			warn(`pub ${id} not found in database, skipping`);
			continue;
		}
		pubs.set(id, pub.toJSON());
	}
	log(`fetched ${pubs.size} pubs`);

	const parentToChildren = new Map<string, Set<string>>();
	const edgesByChild = new Map<string, SavedEdge[]>();

	for (const [id, pub] of pubs) {
		for (const edge of getSupplementEdgesForChild(pub)) {
			const parentId = edge.pubIsParent ? edge.pubId : edge.targetPubId;
			if (parentId === id) {
				continue;
			}
			const existing = parentToChildren.get(parentId) ?? new Set();
			existing.add(id);
			parentToChildren.set(parentId, existing);

			const childEdges = edgesByChild.get(id) ?? [];
			childEdges.push({
				pubId: edge.pubId,
				targetPubId: edge.targetPubId,
				relationType: edge.relationType,
				pubIsParent: edge.pubIsParent,
				approvedByTarget: edge.approvedByTarget,
				rank: edge.rank,
			});
			edgesByChild.set(id, childEdges);
		}
	}

	const missingParentIds = [...parentToChildren.keys()].filter((id) => !pubs.has(id));
	if (missingParentIds.length > 0) {
		log(`discovered ${missingParentIds.length} parents not in failure list, fetching...`);
		const missingFetched = await Promise.all(
			missingParentIds.map(async (id) => ({ id, pub: await findPub(id) })),
		);
		for (const { id, pub } of missingFetched) {
			if (!pub) {
				warn(`parent pub ${id} not found in database`);
				continue;
			}
			pubs.set(id, pub.toJSON());
		}
	}

	const allPubIds = [...pubs.keys()];
	const reviewTypes = new Map<string, string | null>();
	const reviewTypeResults = await Promise.all(
		allPubIds.map(async (id) => ({ id, reviewType: await extractReviewType(pubs.get(id)) })),
	);
	for (const { id, reviewType } of reviewTypeResults) {
		reviewTypes.set(id, reviewType);
	}

	const toPubInfo = (id: string, pub: any): PubInfo => ({
		id,
		title: pub.title,
		doi: pub.doi,
		slug: pub.slug,
		communityId: pub.communityId,
		reviewType: reviewTypes.get(id) ?? null,
	});

	const clusters: Cluster[] = [];
	const visitedIds = new Set<string>();

	for (const [parentId, childIds] of parentToChildren) {
		const parentPub = pubs.get(parentId);
		if (!parentPub) {
			warn(`parent ${parentId} not found, skipping cluster`);
			continue;
		}
		const cluster: Cluster = {
			parent: toPubInfo(parentId, parentPub),
			children: [],
			edges: [],
		};
		visitedIds.add(parentId);

		for (const childId of childIds) {
			const childPub = pubs.get(childId);
			if (!childPub) {
				continue;
			}
			cluster.children.push(toPubInfo(childId, childPub));
			cluster.edges.push(...(edgesByChild.get(childId) ?? []));
			visitedIds.add(childId);
		}
		clusters.push(cluster);
	}

	const standalone: PubInfo[] = [];
	for (const [id, pub] of pubs) {
		if (visitedIds.has(id)) {
			continue;
		}
		standalone.push(toPubInfo(id, pub));
	}

	return { clusters, standalone };
}

async function depositPub(
	pubId: string,
	communityId: string,
	reviewType: string | null,
	label: string,
): Promise<boolean> {
	log(`  depositing ${label}...`);
	if (dryRun) {
		log(`  [dry-run] would deposit ${label} (reviewType=${reviewType})`);
		return true;
	}
	try {
		await setDoiData(
			{
				communityId,
				collectionId: undefined,
				pubId,
				contentVersion: undefined,
				reviewType: reviewType ?? undefined,
				reviewRecommendation: undefined,
			},
			'pub',
		);
		log(`  deposited ${label} successfully`);
		return true;
	} catch (e: any) {
		logErr(`  failed to deposit ${label}: ${e.message}`);
		return false;
	}
}

async function processCluster(cluster: Cluster): Promise<ResultEntry[]> {
	const { parent, children, edges } = cluster;
	const results: ResultEntry[] = [];
	const makeResult = (
		pub: PubInfo,
		role: 'parent' | 'child',
		ok: boolean,
		error?: string,
	): ResultEntry => ({
		id: pub.id,
		title: pub.title,
		doi: pub.doi,
		slug: pub.slug,
		role,
		success: ok,
		error,
		cluster: parent.title,
	});

	log(`\nprocessing cluster: parent="${parent.title}" with ${children.length} children`);

	const parentPub = await findPub(parent.id);
	if (!parentPub) {
		const error = `parent pub ${parent.id} not found`;
		results.push(makeResult(parent, 'parent', false, error));
		for (const child of children) {
			results.push(makeResult(child, 'child', false, error));
		}
		return results;
	}

	const parentJson = parentPub.toJSON();
	const reviewTargetDoi = getReviewTargetDoi(parentJson);
	if (reviewTargetDoi) {
		log(`  parent review target DOI: ${reviewTargetDoi}`);
		const valid = await checkDoiInCrossref(reviewTargetDoi);
		if (!valid) {
			const error = `review target DOI ${reviewTargetDoi} not found in CrossRef`;
			results.push(makeResult(parent, 'parent', false, error));
			for (const child of children) {
				results.push(makeResult(child, 'child', false, error));
			}
			return results;
		}
		log(`  review target DOI verified in CrossRef`);
	} else {
		warn(`  parent "${parent.title}" has no review target DOI, proceeding anyway`);
	}

	const edgeQueries = children.flatMap((child) => [
		PubEdge.findAll({
			where: { pubId: child.id, targetPubId: parent.id, relationType: 'supplement' },
		}),
		PubEdge.findAll({
			where: { pubId: parent.id, targetPubId: child.id, relationType: 'supplement' },
		}),
	]);
	const edgeResults = await Promise.all(edgeQueries);
	const edgeIdsToDestroy = edgeResults.flat().map((e) => e.id);

	log(`  disconnecting ${edgeIdsToDestroy.length} supplement edges`);

	if (dryRun) {
		log(`  [dry-run] would destroy edges: ${edgeIdsToDestroy.join(', ')}`);
		for (const child of children) {
			results.push(makeResult(child, 'child', true));
		}
		log(`  [dry-run] would recreate edges`);
		results.push(makeResult(parent, 'parent', true));
		return results;
	}

	// everything inside withTransaction shares a single db transaction.
	// if any step throws, the transaction rolls back and edges are never
	// visibly deleted.
	return withTransaction(async () => {
		for (const edgeId of edgeIdsToDestroy) {
			// biome-ignore lint/performance/noAwaitInLoops: sequential to avoid race conditions
			await destroyPubEdge(edgeId);
		}

		for (const child of children) {
			// biome-ignore lint/performance/noAwaitInLoops: sequential deposits to respect crossref rate limits
			const childOk = await depositPub(
				child.id,
				child.communityId,
				child.reviewType,
				`child "${child.title}" (${child.doi})`,
			);
			results.push(
				makeResult(child, 'child', childOk, childOk ? undefined : 'deposit failed'),
			);
			if (!childOk) {
				warn(
					`  failed to deposit child "${child.title}", continuing with remaining children`,
				);
			}
		}

		const depositedChildren = children.filter(
			(c) => c.doi && results.find((r) => r.id === c.id && r.success),
		);
		if (depositedChildren.length > 0) {
			log(`  waiting for ${depositedChildren.length} child DOIs to resolve...`);
			for (const child of depositedChildren) {
				// biome-ignore lint/performance/noAwaitInLoops: sequential polling per doi
				const resolved = await waitForDoiResolution(child.doi!, {
					timeoutMs: 120_000,
					intervalMs: 5_000,
					logger,
				});
				if (!resolved) {
					warn(
						`  child DOI ${child.doi} did not resolve within timeout, proceeding anyway`,
					);
				}
			}
		}

		log(`  reconnecting ${edges.length} supplement edges`);
		for (const savedEdge of edges) {
			// biome-ignore lint/performance/noAwaitInLoops: sequential to maintain edge ordering
			await createPubEdge({
				pubId: savedEdge.pubId,
				targetPubId: savedEdge.targetPubId,
				relationType: savedEdge.relationType as any,
				pubIsParent: savedEdge.pubIsParent,
				approvedByTarget: savedEdge.approvedByTarget,
				moveToTop: false,
			});
		}

		const parentOk = await depositPub(
			parent.id,
			parent.communityId,
			parent.reviewType,
			`parent "${parent.title}" (${parent.doi})`,
		);
		results.push(
			makeResult(parent, 'parent', parentOk, parentOk ? undefined : 'deposit failed'),
		);

		return results;
	});
}

async function processStandalone(pub: PubInfo): Promise<ResultEntry> {
	log(`\nprocessing standalone: "${pub.title}" (${pub.doi})`);
	const ok = await depositPub(pub.id, pub.communityId, pub.reviewType, `"${pub.title}"`);
	return {
		id: pub.id,
		title: pub.title,
		doi: pub.doi,
		slug: pub.slug,
		role: 'standalone',
		success: ok,
		error: ok ? undefined : 'deposit failed',
	};
}

async function main() {
	const inputPath = getInputPath();
	const raw = fs.readFileSync(inputPath, 'utf-8');
	const failures: FailureEntry[] = JSON.parse(raw);

	log(`loaded ${failures.length} failure entries from ${inputPath}`);
	if (dryRun) {
		log('running in DRY-RUN mode -- no changes will be made');
	}

	const pubIds = applyRange(failures.map((f) => f.id));
	log(`processing ${pubIds.length} pubs`);

	const { clusters, standalone } = await discoverClusters(pubIds);

	log(`\nfound ${clusters.length} clusters and ${standalone.length} standalone pubs`);
	for (const cluster of clusters) {
		log(
			`  cluster: "${cluster.parent.title}" -> ${cluster.children.map((c) => `"${c.title}"`).join(', ')}`,
		);
	}
	for (const pub of standalone) {
		log(`  standalone: "${pub.title}"`);
	}

	const results: ResultEntry[] = [];

	for (const cluster of clusters) {
		try {
			// biome-ignore lint/performance/noAwaitInLoops: clusters must be processed sequentially
			const clusterResults = await processCluster(cluster);
			results.push(...clusterResults);
		} catch (e: any) {
			logErr(`cluster "${cluster.parent.title}" failed unexpectedly: ${e.message}`);
			results.push({
				id: cluster.parent.id,
				title: cluster.parent.title,
				doi: cluster.parent.doi,
				slug: cluster.parent.slug,
				role: 'parent',
				success: false,
				error: e.message,
				cluster: cluster.parent.title,
			});
		}
	}

	for (const pub of standalone) {
		try {
			// biome-ignore lint/performance/noAwaitInLoops: sequential deposits to respect crossref rate limits
			const result = await processStandalone(pub);
			results.push(result);
		} catch (e: any) {
			logErr(`standalone "${pub.title}" failed unexpectedly: ${e.message}`);
			results.push({
				id: pub.id,
				title: pub.title,
				doi: pub.doi,
				slug: pub.slug,
				role: 'standalone',
				success: false,
				error: e.message,
			});
		}
	}

	const succeeded = results.filter((r) => r.success).length;
	const failed = results.filter((r) => !r.success).length;
	log(`\ndone. ${succeeded} succeeded, ${failed} failed.`);

	const outputPath = writeResults('results', results);
	log(`results written to ${outputPath}`);

	if (failed > 0) {
		process.exit(1);
	}
	process.exit(0);
}

main().catch((e) => {
	logErr(`fatal: ${e.message}`);
	console.error(e);
	process.exit(1);
});
