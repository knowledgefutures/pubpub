import { modelize, setup } from 'stubstub';

import { UserSubscription } from 'server/models';

import { DocJson } from 'types';
import { createThreadComment } from '../queries';

const models = modelize`
    User willBeSubscribed {
        UserNotificationPreferences {
            subscribeToThreadsAsCommenter: true
        }
    }
    User willNotBeSubscribed {
        UserNotificationPreferences {
            subscribeToThreadsAsCommenter: false
        }
    }
    Community {
        Pub pub {
            Discussion publicDiscussion {
                number: 1
                author: User {}
                Visibility {
                    access: "public"
                }
                Thread thread {}
            }
        }
    }
`;

setup(beforeAll, models.resolve);

describe('createThreadComment()', () => {
	it('subscribes a user to a thread when they comment in it, according to their notification preferences', async () => {
		const { willBeSubscribed, willNotBeSubscribed, thread } = models;
		await Promise.all(
			(
				[
					[willBeSubscribed, 1],
					[willNotBeSubscribed, 0],
				] as const
			).map(async ([user, count]) => {
				await createThreadComment({
					text: '',
					content: {} as DocJson,
					threadId: thread.id,
					userId: user.id,
				});
				expect(
					await UserSubscription.count({
						where: { userId: user.id, threadId: thread.id },
					}),
				).toEqual(count);
			}),
		);
	});
});
