// @ts-check
/* eslint-disable no-console */
import { Community } from 'server/models';
import { asyncMap } from 'utils/async';

async function main() {
	let offset = 0;
	let done = false;

	const LIMIT = 200;

	while (!done) {
		console.log(`Fetching communities from ${offset} to ${offset + LIMIT}`);
		// eslint-disable-next-line no-await-in-loop
		const communities = await Community.findAll({
			limit: LIMIT,
			attributes: ['id', 'analyticsSettings'],
			offset,
		});

		console.log(`Creating analyticsSettings for ${communities.length} communities`);

		// eslint-disable-next-line no-await-in-loop
		await asyncMap(
			communities,
			(community) =>
				community.update({
					analyticsSettings: {
						type: 'default',
						credentials: null,
					},
				}),
			{
				concurrency: 10,
			},
		);

		console.log(
			`✅ Sucessfully backfilled analyticsSettings for communities ${offset} to ${
				offset + communities.length
			}`,
		);

		if (communities.length !== LIMIT) {
			done = true;
			console.log(`✅ Sucessfully backfilled analyticsSettings for all communities`);
			break;
		}

		offset += LIMIT;
	}
	process.exit(0);
}

main();
