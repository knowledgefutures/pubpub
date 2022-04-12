/* eslint-disable no-console */
import { asyncMap } from 'utils/async';
import { Community, Pub } from 'server/models';

import { setBranchMaintenanceMode } from './utils/branchMaintenance';
import { promptOkay } from './utils/prompt';

const {
	argv: {
		community: communitySubdomain,
		pubId,
		pubSlug,
		branch: branchTitle = 'draft',
		remove,
		concurrency: concurrencyStr = 1,
	},
} = require('yargs');

const communityMaintenance = async (subdomain) => {
	const community = await Community.findOne({ where: { subdomain } });
	const concurrency = parseInt(concurrencyStr, 10);
	console.log(`Using concurrency=${concurrency}`);
	if (community) {
		const pubs = await Pub.findAll({ where: { communityId: community.id } });
		await promptOkay(`Act on ${pubs.length} Pubs?`, { throwIfNo: true });
		await asyncMap(
			pubs,
			(pub) =>
				asyncMap(
					['draft', 'public'],
					async (branch) => {
						console.log(`${pub.slug}.${branch}`);
						await setBranchMaintenanceMode({
							pubSlug: pub.slug,
							branchTitle: branch,
							remove,
						}).catch((err) => console.warn(err));
					},
					{ concurrency: 1 },
				),
			{ concurrency },
		);
	} else {
		// eslint-disable-next-line no-console
		console.log(`Could not find Community by subdomain {communitySubdomain}`);
	}
};

const main = async () => {
	if (communitySubdomain) {
		await communityMaintenance(communitySubdomain);
	} else {
		await setBranchMaintenanceMode({
			pubSlug,
			pubId,
			branchTitle,
			remove,
		});
	}
};

main().then(() => process.exit(0));
