import * as types from 'types';
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
import * as urls from 'utils/canonicalUrls';
import { discussionTitle } from 'utils/activity/titles/discussion';
import { ActivityRenderContext } from 'client/utils/activity/types';

const mg = mailgun.client({
	username: 'api',
	key: process.env.MAILGUN_API_KEY!,
});

const template = async (activityItem: types.PubDiscussionCommentAddedActivityItem) => {
	const actor: types.User = await User.findByPk(activityItem.actorId);
	const community: types.Community = await Community.findByPk(activityItem.communityId);
	const communityUrl = urls.communityUrl(community);
	const pub: types.Pub = await Pub.findByPk(activityItem.pubId);
	const pubUrl = urls.pubUrl(community, pub);
	const pubTitle = pub.htmlTitle ?? pub.title;
	const { href, title } = discussionTitle(activityItem, {
		scope: {
			communityId: activityItem.communityId,
			pubId: activityItem.pubId,
		},
		associations: {
			pub: {
				[pub.id]: pub,
			},
			community: {
				[community.id]: community,
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

const createEmailForUserNotification = async (notification: types.UserNotification) => {
	const userNotificationPreferences: types.UserNotificationPreferences =
		await UserNotificationPreferences.findOne({
			where: {
				userId: notification.userId,
			},
		});
	if (!userNotificationPreferences?.receiveDiscussionThreadEmails) {
		return;
	}
	const user: types.UserWithPrivateFields = await User.findByPk(notification.userId);
	const activityItem: types.ActivityItem = await ActivityItem.findByPk(
		notification.activityItemId,
	);
	if (activityItem?.kind === 'pub-discussion-comment-added') {
		await mg.messages.create('mg.pubpub.org', {
			from: 'PubPub Team <hello@mg.pubpub.org>',
			to: [user.email],
			subject: 'New reply to PubPub discussion',
			html: await template(activityItem),
		});
	}
};

UserNotification.afterCreate((item: types.UserNotification) => {
	defer(() => createEmailForUserNotification(item));
});
