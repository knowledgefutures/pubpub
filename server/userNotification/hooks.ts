import type { ActivityRenderContext } from 'client/utils/activity/types';
import type * as types from 'types';

import mailgun from 'mailgun.js';
import stripIndent from 'strip-indent';

import {
	ActivityItem,
	Community,
	Pub,
	User,
	UserNotification,
	UserNotificationPreferences,
} from 'server/models';
import { defer } from 'server/utils/deferred';
import { discussionTitle } from 'utils/activity/titles/discussion';
import { expect } from 'utils/assert';
import * as urls from 'utils/canonicalUrls';

export const mg = mailgun.client({
	username: 'api',
	key: process.env.MAILGUN_API_KEY!,
});

const template = async (activityItem: types.ActivityItemOfKind<'pub-discussion-comment-added'>) => {
	const actor = expect(await User.findByPk(expect(activityItem.actorId)));
	const community = expect(await Community.findByPk(activityItem.communityId));
	const communityUrl = urls.communityUrl(community);
	const pub = expect(await Pub.findByPk(activityItem.pubId));
	const pubUrl = urls.pubUrl(community, pub);
	const pubTitle = pub.htmlTitle ?? pub.title;
	const { href, title } = discussionTitle(activityItem, {
		scope: {
			communityId: activityItem.communityId,
			pubId: activityItem.pubId,
		},
		associations: {
			pub: {
				[pub.id]: pub as types.Pub,
			},
			community: {
				[community.id]: community as types.Community,
			},
		},
		userId: activityItem.actorId,
	} as ActivityRenderContext);
	return stripIndent(`
    <p>
			${actor.fullName} added <a href="${href}">${title}</a> to <a href="${pubUrl}">${pubTitle}</a>.
		</p>
    <p>
			<a href="${communityUrl}/legal/settings#notification-preferences">Unsubscribe</a>
		</p>
  `);
};

const createEmailForUserNotification = async (notification: UserNotification) => {
	const userNotificationPreferences = await UserNotificationPreferences.findOne({
		where: {
			userId: notification.userId,
		},
	});
	if (!userNotificationPreferences?.receiveDiscussionThreadEmails) {
		return;
	}
	const user = expect(await User.findByPk(notification.userId));
	const activityItem = expect(await ActivityItem.findByPk(notification.activityItemId));
	if (activityItem.kind === 'pub-discussion-comment-added') {
		await mg.messages.create('mg.pubpub.org', {
			from: 'PubPub Team <hello@mg.pubpub.org>',
			to: [user.email],
			subject: 'New reply to PubPub discussion',
			html: await template(
				activityItem as types.ActivityItemOfKind<'pub-discussion-comment-added'>,
			),
		});
	}
};

UserNotification.afterCreate((item) => {
	defer(() => createEmailForUserNotification(item));
});
