import { Collection, Community, Member, Page, ScopeSummary, SpamTag } from 'server/models';

export async function logg<T>(
	out: Record<string, number>,
	id: string,
	query: Promise<T>,
): Promise<T> {
	const now = process.hrtime.bigint();
	const result = await query;
	const end = process.hrtime.bigint();
	out[id] = Number(end - now) / 1_000_000;
	return result;
}

export function createLogger(initialId: string) {
	let acc = {} as Record<string, number> | null;

	// @ts-ignore
	const logger = logg.bind(this as any, acc);

	const log = <T>(id: string, q: Promise<T>) => {
		return logger(`${initialId}:${id}`, q) as unknown as Promise<T>;
	};

	const now = process.hrtime.bigint();

	return {
		log,
		end: () => {
			const end = process.hrtime.bigint();

			const total = Number(end - now) / 1_000_000;
			const totalSum = Object.entries(acc ?? {}).reduce((acc, [k, v]) => (acc += v), 0);

			console.log(`Total for ${initialId}:`);
			console.log(`- Start => End: ${total} ms`);
			console.log(`- Sum of all:   ${totalSum} ms`);
			console.log('--------------------');
			Object.entries(acc ?? {}).forEach(([k, v]) => {
				console.log(`- ${k}: ${v}ms`);
			});
			console.log('--------------------\n\n');
			acc = null;
		},
	};
}

export default async function communityGet(locationData, whereQuery) {
	const { end, log } = createLogger('communityGet');
	// Community lookup
	const community = await log(
		'community',
		Community.findOne({
			where: whereQuery,
			raw: true,
			nest: true,
			include: [
				{ model: ScopeSummary, as: 'scopeSummary' },
				{ model: SpamTag, as: 'spamTag' },
			],
			// logging: (sql, ms) => console.log(`[communityGet SQL ${ms}ms] ${sql}`),
		}),
	);
	if (!community) {
		throw new Error('Community Not Found');
	}

	const [pages, collections] = await Promise.all([
		Page.findAll({
			where: { communityId: community.id },
			raw: true,
			attributes: { exclude: ['updatedAt', 'communityId', 'layout'] },
		}),
		Collection.findAll({
			where: { communityId: community.id },
			raw: true,
			attributes: { exclude: ['layout'] },
		}),
	]);

	community.pages = pages;
	community.collections = collections;

	const collectionIds = collections.map((c) => c.id);

	// members (single query; no huge join)
	const members = await log(
		'members',
		Member.findAll({
			where: { collectionId: collectionIds },
			raw: true,
		}),
	);
	// attach members to collections
	const byCollectionId = new Map();
	await log(
		'compile',
		new Promise<void>((resolve) => {
			for (const m of members) {
				const k = m.collectionId;
				const arr = byCollectionId.get(k);
				if (arr) arr.push(m);
				else byCollectionId.set(k, [m]);
			}
			if (!community.collections) {
				resolve();
				return;
			}
			for (const c of community.collections) {
				c.members = byCollectionId.get(c.id) ?? [];
			}
			resolve();
		}),
	);

	end();

	return community;
}
