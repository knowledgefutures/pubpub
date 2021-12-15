import { modelize, setup } from 'stubstub';

import { UserSubscription } from 'server/models';

import { createPubAttribution } from '../queries';

const models = modelize`
    User willBeSubscribed {
        UserNotificationPreferences {
            subscribeToPubsAsContributor: true
        }
    }
    User willNotBeSubscribed {
        UserNotificationPreferences {
            subscribeToPubsAsContributor: false
        }
    }
    Community {
        Pub pub {}
    }
`;

setup(beforeAll, models.resolve);

describe('createPubAttribution()', () => {
	it("subscribes a user to a Pub's threads when they are added as a contributor, according to their notification preferences", async () => {
		const { willBeSubscribed, willNotBeSubscribed, pub } = models;
		await Promise.all(
			(
				[
					[willBeSubscribed, 1],
					[willNotBeSubscribed, 0],
				] as const
			).map(async ([user, count]) => {
				await createPubAttribution({
					userId: user.id,
					pubId: pub.id,
					name: null,
					order: count,
					isAuthor: false,
				});
				expect(
					await UserSubscription.count({ where: { userId: user.id, pubId: pub.id } }),
				).toEqual(count);
			}),
		);
	});
});
