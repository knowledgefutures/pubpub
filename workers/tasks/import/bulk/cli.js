import fs from 'fs-extra';

import { User } from 'server/models';

import { runBulkImportFromDirectory } from './import';
import { discardBulkImportPlan } from './discard';
import { publishBulkImportPlan } from './publish';
import { promptOkay } from './prompt';

const {
	argv: { directory, ...args },
} = require('yargs')
	.option('actor', {
		demandOption: true,
		description: 'Slug of PubPub user to take import actions',
		type: 'string',
	})
	.option('directory', {
		description: 'Directory to read when importing',
		type: 'path',
		normalize: true,
	})
	.option('community', {
		description: 'Subdomain of community to target with import',
		type: 'string',
	})
	.option('dry-run', {
		description: 'Print a plan without executing any actions',
		type: 'boolean',
	})
	.option('receipt', {
		description:
			'Path to write or read an import receipt with information about an executed plan',
		type: 'string',
		normalize: true,
	})
	.option('discard', {
		description: 'Discard items created by the specified plan',
		type: 'boolean',
	})
	.option('publish', {
		description: 'Publish (release and make public) items created by the specified plan',
		type: 'boolean',
	})
	.option('yes', {
		description: 'Skip confirmation prompts (at your own peril)',
		type: 'boolean',
	});

export const getActor = async (userSlug) => {
	if (!userSlug) {
		throw new Error('Specify an actor to run bulk import');
	}
	const user = await User.findOne({ where: { slug: userSlug } });
	if (!user) {
		throw new Error(`No user by slug ${userSlug}`);
	}
	return user;
};

const readPlanFromFile = async (path) => {
	const contents = await fs.readFile(path);
	try {
		return JSON.parse(contents);
	} catch (err) {
		throw new Error(`Expected a valid JSON file at ${path}`);
	}
};

const writePlanToFile = async (path, plan) => {
	return fs.writeFile(path, JSON.stringify(plan));
};

const main = async () => {
	const { actor: actorSlug, community, yes, dryRun, discard, publish, receipt } = args;
	const actor = await getActor(actorSlug);
	const shouldImport = !discard && !publish;
	if (shouldImport) {
		const needsMode = !dryRun && !receipt;
		if (needsMode) {
			throw new Error(
				'Please supply either --receipt=path/to/receipt to store a record of this import (or use --dry-run)',
			);
		}
		const exists = await fs.exists(receipt);
		if (exists) {
			await promptOkay(
				`There is already a file at the receipt path ${receipt} which will be overwritten during import. Proceed?`,
				{ throwIfNo: true, yesIsDefault: false, yes: yes },
			);
		}
		const plan = await runBulkImportFromDirectory({
			directory: directory,
			actor: actor,
			community: community,
			yes: yes,
			dryRun: dryRun,
		});
		if (plan) {
			await writePlanToFile(receipt, plan);
		}
	}
	if (discard) {
		if (!receipt) {
			throw new Error(
				'Please supply a --receipt=path/to/receipt specifying items to discard.',
			);
		}
		const plan = await readPlanFromFile(receipt);
		await discardBulkImportPlan({ plan: plan, yes: yes, dryRun: dryRun });
	} else if (publish) {
		if (!receipt) {
			throw new Error(
				'Please supply a --receipt=path/to/receipt specifying items to publish.',
			);
		}
		const plan = await readPlanFromFile(receipt);
		await publishBulkImportPlan({ plan: plan, yes: yes, dryRun: dryRun, actor: actor });
	}
};

main()
	.catch((err) => console.error(err))
	.finally(() => process.exit(0));
