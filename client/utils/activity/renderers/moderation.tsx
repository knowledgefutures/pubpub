import type {
	BanReason,
	CommunityBanCreatedActivityItem,
	CommunityBanRetractedActivityItem,
} from 'types';

import type { ActivityRenderContext } from '../types';

import React from 'react';

import { communityTitle } from 'utils/activity/titles';
import { getPubFromContext } from 'utils/activity/titles/util';
import { getDashUrl } from 'utils/dashboard';
import { getReasonLabel } from 'utils/moderationReasons';

import { itemRenderer } from './itemRenderer';

type BanItem = CommunityBanCreatedActivityItem | CommunityBanRetractedActivityItem;

const bannedUserTitle = (item: BanItem, context: ActivityRenderContext) => {
	const userId = item.payload.userId;
	if (!userId) return { title: 'unknown user' };
	const user = context.associations.user[userId];
	if (!user) return { title: 'unknown user' };
	return { title: user.fullName, href: `/user/${user.slug}` };
};

const buildExcerpt = (options: { item: BanItem; context: ActivityRenderContext }) => {
	const { item } = options;
	const { reason, sourcePubId } = item.payload;
	const parts: React.ReactNode[] = [];

	if (reason) {
		parts.push(
			<span key="reason">
				Reason: <strong>{getReasonLabel(reason as BanReason)}</strong>
			</span>,
		);
	}

	if (sourcePubId) {
		const pub = getPubFromContext(sourcePubId, options.context);
		if (pub) {
			parts.push(
				<span key="pub">
					{' '}
					&middot; Source:{' '}
					<a href={getDashUrl({ pubSlug: pub.slug })}>
						<em>{pub.title}</em>
					</a>
				</span>,
			);
		}
	}

	if (parts.length === 0) return null;
	return <span>{parts}</span>;
};

export const renderCommunityBanCreated = itemRenderer<
	CommunityBanCreatedActivityItem,
	'bannedUser' | 'community'
>({
	icon: 'flag',
	titleRenderers: {
		bannedUser: bannedUserTitle,
		community: communityTitle,
	},
	message: ({ titles }) => {
		const { actor, bannedUser, community } = titles;
		return (
			<>
				{actor} banned {bannedUser} from {community}
			</>
		);
	},
	excerpt: buildExcerpt,
});

export const renderCommunityBanRetracted = itemRenderer<
	CommunityBanRetractedActivityItem,
	'bannedUser' | 'community'
>({
	icon: 'flag',
	titleRenderers: {
		bannedUser: bannedUserTitle,
		community: communityTitle,
	},
	message: ({ titles }) => {
		const { actor, bannedUser, community } = titles;
		return (
			<>
				{actor} unbanned {bannedUser} from {community}
			</>
		);
	},
});
