import { Community } from 'server/models';
import 'server/hooks';

import { buildImportPlan, printImportPlan } from './plan';
import { resolveImportPlan } from './resolve';
import { promptOkay } from './prompt';

const getCommunity = async (subdomain) => {
	if (!subdomain) {
		return null;
	}
	const community = await Community.findOne({ where: { subdomain } });
	if (!community) {
		throw new Error(`No Community by subdomain ${subdomain}`);
	}
	return community;
};

export const runBulkImportFromDirectory = async ({
	directory,
	actor,
	community: communitySubdomain,
	yes,
	dryRun,
}) => {
	const plan = await buildImportPlan(directory);
	const community = await getCommunity(communitySubdomain);
	printImportPlan(plan);
	if (dryRun) {
		// eslint-disable-next-line no-console
		console.log('Dry run. Exiting.');
		return null;
	}
	await promptOkay('Proceed with this import?', { throwIfNo: true, yes });
	return resolveImportPlan({
		importPlan: plan,
		parents: { community },
		actor,
	});
};
