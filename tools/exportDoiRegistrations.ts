/**
 * Export every registered DOI (pubs + collections with a stored Crossref
 * deposit record) as NDJSON for the Doily migration. One line per DOI, shape
 * defined by doily's src/deposit/pubpub-import/export-row.ts.
 *
 *   npm run tools exportDoiRegistrations -- --out doi-export.ndjson
 *   npm run tools exportDoiRegistrations -- --subdomain demo --out demo.ndjson
 */
import { createWriteStream } from 'fs';
import { Op } from 'sequelize';

import { Collection, Community, CrossrefDepositRecord, DepositTarget, Pub } from 'server/models';

const getArgValue = (name: string) => {
	const index = process.argv.indexOf(name);
	return index === -1 ? null : process.argv[index + 1];
};

const depositedWhere = {
	doi: { [Op.not]: null },
	crossrefDepositRecordId: { [Op.not]: null },
};

type CommunityLite = {
	id: string;
	subdomain: string;
	title: string;
	citeAs: string | null;
	publishAs: string | null;
	kfOrgId: string | null;
};

const communityAttributes = ['id', 'subdomain', 'title', 'citeAs', 'publishAs', 'kfOrgId'];

async function main() {
	const out =
		getArgValue('--out') ?? `doi-export-${new Date().toISOString().slice(0, 10)}.ndjson`;
	const subdomain = getArgValue('--subdomain');

	let communityFilter: { communityId: string } | {} = {};
	if (subdomain) {
		const community = await Community.findOne({ where: { subdomain } });
		if (!community) {
			// eslint-disable-next-line no-console
			console.error(`community with subdomain "${subdomain}" not found`);
			process.exit(1);
		}
		communityFilter = { communityId: community.id };
	}

	const depositTargets = await DepositTarget.findAll({
		attributes: ['communityId', 'service', 'doiPrefix'],
	});
	const targetByCommunity = new Map(
		depositTargets.map((target) => [
			target.communityId,
			{ service: target.service ?? 'crossref', doiPrefix: target.doiPrefix },
		]),
	);

	const include = [
		{ model: Community, as: 'community', attributes: communityAttributes },
		{ model: CrossrefDepositRecord, as: 'crossrefDepositRecord' },
	];

	const [pubs, collections] = await Promise.all([
		Pub.findAll({
			where: { ...depositedWhere, ...communityFilter },
			attributes: ['id', 'doi', 'communityId'],
			include,
		}),
		Collection.findAll({
			where: { ...depositedWhere, ...communityFilter },
			attributes: ['id', 'doi', 'communityId'],
			include,
		}),
	]);

	const stream = createWriteStream(out);
	let written = 0;

	const writeRow = (
		scope: 'pub' | 'collection',
		item: {
			id: string;
			doi: string | null;
			communityId: string;
			community?: CommunityLite;
			crossrefDepositRecord?: {
				depositJson: object | null;
				createdAt?: Date;
				updatedAt?: Date;
			};
		},
	) => {
		const record = item.crossrefDepositRecord;
		const community = item.community;
		if (!item.doi || !record?.depositJson || !community) {
			return;
		}
		const row = {
			scope,
			...(scope === 'pub' ? { pubId: item.id } : { collectionId: item.id }),
			doi: item.doi,
			communityId: item.communityId,
			community: {
				subdomain: community.subdomain,
				title: community.title,
				citeAs: community.citeAs,
				publishAs: community.publishAs,
				kfOrgId: community.kfOrgId,
			},
			depositTarget: targetByCommunity.get(item.communityId) ?? null,
			depositJson: record.depositJson,
			depositRecordCreatedAt: record.createdAt?.toISOString(),
			depositRecordUpdatedAt: record.updatedAt?.toISOString(),
		};
		stream.write(`${JSON.stringify(row)}\n`);
		written += 1;
	};

	pubs.forEach((pub) => writeRow('pub', pub as any));
	collections.forEach((collection) => writeRow('collection', collection as any));

	await new Promise((resolve) => stream.end(resolve));
	// eslint-disable-next-line no-console
	console.log(
		`wrote ${written} rows (${pubs.length} pubs, ${collections.length} collections) to ${out}`,
	);
	process.exit(0);
}

main();
