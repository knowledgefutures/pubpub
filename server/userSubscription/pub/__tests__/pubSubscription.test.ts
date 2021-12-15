import { modelize, login, setup, teardown } from 'stubstub';

import { findUserSubscription } from 'server/userSubscription/shared/queries';

const models = modelize`
    Community {
        Pub pub {}
        Pub otherPub {
            UserSubscription existingSubscription {
                user: user
                setAutomatically: false
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
			.put('/api/pubs/subscriptions')
			.send({ pubId: pub.id, status: 'active' })
			.expect(200);
		expect(userSubscription).toMatchObject({
			pubId: pub.id,
			userId: user.id,
			status: 'active',
		});
	});

	it('allows a user to mute their subscription to a Pub', async () => {
		const { user, otherPub, existingSubscription } = models;
		const agent = await login(user);
		await agent
			.put('/api/pubs/subscriptions')
			.send({ pubId: otherPub.id, status: 'muted' })
			.expect(200);
		const subscriptionNow = await findUserSubscription({ id: existingSubscription.id });
		expect(subscriptionNow?.status).toBe('muted');
	});
});
