import fs from 'fs';
import path from 'path';

import {
	applyRange,
	type CheckResult,
	checkDoisResolve,
	createLogger,
	getInputPath,
	writeResults,
} from './shared';

type InputEntry = {
	id: string;
	doi?: string | null;
	title?: string;
	pub?: string;
	slug?: string;
	success?: boolean;
	role?: string;
};

type VerifyResult = {
	id: string;
	doi: string | null;
	title: string;
	slug: string;
	resolves: boolean | null;
	role?: string;
	error?: string;
};

const { log } = createLogger('verify-dois');

async function main() {
	const inputPath = getInputPath();
	const raw = fs.readFileSync(inputPath, 'utf-8');
	const allEntries: InputEntry[] = JSON.parse(raw);
	const entries = applyRange(allEntries);

	log(`loaded ${allEntries.length} entries from ${inputPath}, processing ${entries.length}`);

	type CheckItem = { id: string; doi: string; title: string; slug: string; role?: string };
	const toCheck: CheckItem[] = [];
	const noDoi: InputEntry[] = [];

	for (const e of entries) {
		if (e.doi) {
			toCheck.push({
				id: e.id,
				doi: e.doi,
				title: e.title ?? e.pub ?? e.id,
				slug: e.slug ?? '',
				role: e.role,
			});
		} else {
			noDoi.push(e);
		}
	}

	log(`${toCheck.length} entries have DOIs to verify`);

	const checkResults = await checkDoisResolve(
		toCheck,
		(item) => item.doi,
		(checked, total) => log(`  checked ${checked}/${total}`),
	);

	const results: VerifyResult[] = [];

	for (const item of toCheck) {
		const result = checkResults.get(item) as CheckResult;
		results.push({
			id: item.id,
			doi: item.doi,
			title: item.title,
			slug: item.slug,
			resolves: result.ok,
			role: item.role,
			error: result.ok ? undefined : result.error,
		});
	}

	for (const e of noDoi) {
		results.push({
			id: e.id,
			doi: null,
			title: e.title ?? e.pub ?? e.id,
			slug: e.slug ?? '',
			resolves: null,
			role: e.role,
			error: 'no DOI to check',
		});
	}

	const found = results.filter((r) => r.resolves === true).length;
	const notFound = results.filter((r) => r.resolves === false).length;
	const errored = results.filter((r) => r.resolves === null && r.doi).length;

	log(`\nresults:`);
	log(`  resolves: ${found}`);
	log(`  NOT resolving: ${notFound}`);
	log(`  check failed: ${errored}`);
	log(`  no DOI: ${noDoi.length}`);

	if (notFound > 0) {
		log(`\nmissing DOIs:`);
		for (const r of results.filter((r) => r.resolves === false)) {
			log(`  ${r.doi} - "${r.title}"`);
		}
	}

	const outputPath = writeResults(`verify-${path.basename(inputPath, '.json')}`, results);
	log(`\nfull results written to ${outputPath}`);

	if (notFound > 0) {
		process.exit(1);
	}
}

main().catch((e) => {
	console.error(`[verify-dois] fatal: ${e.message}`);
	console.error(e);
	process.exit(1);
});
