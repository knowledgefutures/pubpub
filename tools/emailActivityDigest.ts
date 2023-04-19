/* eslint-disable no-restricted-syntax */

import { Op } from 'sequelize';
import mailgun from 'mailgun.js';

import { asyncMap } from 'utils/async';
import { iterAllCommunities } from 'server/community/queries';
import { Member, includeUserModel } from 'server/models';
import { renderDigestEmail } from 'server/utils/email';
import * as types from 'types';

const mg = mailgun.client({
	username: 'api',
	key: process.env.MAILGUN_API_KEY!,
});

const memberQueryOptions = {
	include: [includeUserModel({ attributes: ['email'], as: 'user' })],
	permissions: { [Op.or]: ['admin', 'manage'] },
};

// This script will generate a maximum of 100 digest emails concurrently,
// hopefully not spiking CPU or memory usage too hard.
async function main() {
	// For each (sensibly-sized) chunk of communities
	for await (const communities of iterAllCommunities(10)) {
		const tasks = communities.map((community) => {
			// eslint-disable-next-line no-console
			console.log(`community ${community.subdomain}`);
			// Load all community members who are subscribed to activity digest
			// emails
			const members: Promise<types.DefinitelyHas<types.Member, 'user'>[]> = Member.findAll({
				where: {
					communityId: community.id,
					subscribedToActivityDigest: true,
				},
				...memberQueryOptions,
			});
			// For each chunk of those users
			return asyncMap(
				members,
				async ({ user }) => {
					try {
						const email = (user as any).email;
						// eslint-disable-next-line no-console
						console.log(`user ${user.id} ${email}`);
						// Create an activity digest email
						const scope = { communityId: community.id };
						const digest = await renderDigestEmail(community, { scope, user });
						if (digest === null) return;
						await mg.messages.create('mg.pubpub.org', {
							from: 'PubPub Team <hello@mg.pubpub.org>',
							to: [email],
							subject: `${community.title} daily activity digest`,
							html: digest,
							'h:Reply-To': 'hello@pubpub.org',
						});
					} catch (err) {
						// eslint-disable-next-line no-console
						console.log(`sending email failed: ${err}`);
					}
				},
				{ concurrency: 10 },
			);
		});

		// Wait for this batch of emails to send.
		await Promise.all(tasks);
	}
}

main()
	.then(() => {
		console.info('Done!');
	})
	.catch((err) => {
		console.error('Failed!');
		console.error(err);
	})
	.finally(() => process.exit(0));
