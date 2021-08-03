/* global describe, it, expect, beforeAll, afterAll */
import { modelize, login, setup, teardown } from 'stubstub';

import { findUserSubscription } from 'server/userSubscription/shared/queries';

const models = modelize`
    Community {
        Pub pub {}
        Pub otherPub {
            UserSubscription existingSubscription {
                user: user
                createdAutomatically: false
            }
        }
    }
    User user {}
`;

setup(beforeAll, models.resolve);
teardown(afterAll);

describe('/api/pubs/subscriptions', () => {
	it('allows a user to subscribe to a Pub', async () => {
		const { user, pub } = models;
		const agent = await login(user);
		const { body: userSubscription } = await agent
			.post('/api/pubs/subscriptions')
			.send({ pubId: pub.id })
			.expect(200);
		expect(userSubscription).toMatchObject({ pubId: pub.id, userId: user.id });
	});

	it('allows a user to mute their subscription to a Pub', async () => {
		const { user, otherPub, existingSubscription } = models;
		const agent = await login(user);
		await agent
			.put('/api/pubs/subscriptions')
			.send({ pubId: otherPub.id, muted: true })
			.expect(200);
		const subscriptionNow = await findUserSubscription({ id: existingSubscription.id });
		expect(subscriptionNow?.muted).toBe(true);
	});
});
