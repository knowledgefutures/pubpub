import {
	createCommunityBanCreatedActivityItem,
	createCommunityBanRetractedActivityItem,
} from 'server/activityItem/queries';
import { CommunityBan } from 'server/models';
import { defer } from 'server/utils/deferred';

const buildOptions = (ban: CommunityBan) => ({
	actorId: ban.actorId,
	communityId: ban.communityId,
	bannedUserId: ban.userId,
	reason: ban.reason,
	sourceThreadCommentId: ban.sourceThreadCommentId,
});

CommunityBan.afterCreate(async (ban) => {
	defer(async () => {
		await createCommunityBanCreatedActivityItem(buildOptions(ban));
	});
});

CommunityBan.afterUpdate(async (ban) => {
	const previousStatus = ban.previous('status');
	if (previousStatus === 'active' && ban.status === 'retracted') {
		defer(async () => {
			await createCommunityBanRetractedActivityItem(buildOptions(ban));
		});
	}
	if (previousStatus === 'retracted' && ban.status === 'active') {
		defer(async () => {
			await createCommunityBanCreatedActivityItem(buildOptions(ban));
		});
	}
});
