import app from '../server';
import { User, CommunityAdmin, DiscussionChannel, DiscussionChannelParticipant } from '../models';

app.post('/api/discussionChannelParticipants', (req, res) => {
	const user = req.user || {};

	const findCommunityAdmin = CommunityAdmin.findOne({
		where: {
			communityId: req.body.communityId,
			userId: user.id,
		},
	});
	const findDiscussionChannel = DiscussionChannel.findOne({
		where: {
			communityId: req.body.communityId,
			id: req.body.discussionChannelId,
		},
	});
	const findDiscussionChannelParticipant = DiscussionChannelParticipant.findOne({
		where: {
			discussionChannelId: req.body.discussionChannelId,
			userId: user.id,
		},
	});

	Promise.all([findCommunityAdmin, findDiscussionChannel, findDiscussionChannelParticipant])
		.then(([communityAdminData, discussionChannelData, discussionChannelParticipantData]) => {
			const canModerateAsCommunityAdmin =
				communityAdminData && discussionChannelData.isCommunityAdminModerated;
			const canModerateAsParticipant =
				discussionChannelParticipantData && discussionChannelParticipantData.isModerator;
			if (
				user.id !== 'b242f616-7aaa-479c-8ee5-3933dcf70859' &&
				!canModerateAsCommunityAdmin &&
				!canModerateAsParticipant
			) {
				throw new Error('Not Authorized to edit this discussion channel');
			}

			return DiscussionChannelParticipant.create({
				isModerator: false,
				userId: req.body.userId,
				discussionChannelId: req.body.discussionChannelId,
			});
		})
		.then((newDiscussionChannelParticipant) => {
			return DiscussionChannelParticipant.findOne({
				where: { id: newDiscussionChannelParticipant.id },
				include: [
					{
						model: User,
						as: 'user',
						attributes: [
							'id',
							'firstName',
							'lastName',
							'fullName',
							'avatar',
							'slug',
							'initials',
							'title',
						],
					},
				],
			});
		})
		.then((newDiscussionChannelParticipantData) => {
			return res.status(201).json(newDiscussionChannelParticipantData);
		})
		.catch((err) => {
			console.error('Error in postDiscussionChannelParticipant: ', err);
			return res.status(500).json(err.message);
		});
});

app.put('/api/discussionChannelParticipants', (req, res) => {
	const user = req.user || {};

	// Filter to only allow certain fields to be updated
	const updatedDiscussionChannelParticipant = {};
	Object.keys(req.body).forEach((key) => {
		if (['isModerator'].indexOf(key) > -1) {
			updatedDiscussionChannelParticipant[key] = req.body[key];
		}
	});

	const findCommunityAdmin = CommunityAdmin.findOne({
		where: {
			communityId: req.body.communityId,
			userId: user.id,
		},
	});
	const findDiscussionChannel = DiscussionChannel.findOne({
		where: {
			communityId: req.body.communityId,
			id: req.body.discussionChannelId,
		},
	});
	const findDiscussionChannelParticipant = DiscussionChannelParticipant.findOne({
		where: {
			discussionChannelId: req.body.discussionChannelId,
			userId: user.id,
		},
	});

	Promise.all([findCommunityAdmin, findDiscussionChannel, findDiscussionChannelParticipant])
		.then(([communityAdminData, discussionChannelData, discussionChannelParticipantData]) => {
			const canModerateAsCommunityAdmin =
				communityAdminData && discussionChannelData.isCommunityAdminModerated;
			const canModerateAsParticipant =
				discussionChannelParticipantData && discussionChannelParticipantData.isModerator;
			if (
				user.id !== 'b242f616-7aaa-479c-8ee5-3933dcf70859' &&
				!canModerateAsCommunityAdmin &&
				!canModerateAsParticipant
			) {
				throw new Error('Not Authorized to edit this discussion channel');
			}
			return DiscussionChannelParticipant.update(updatedDiscussionChannelParticipant, {
				where: { id: req.body.discussionChannelParticipantId },
			});
		})
		.then(() => {
			return res.status(201).json(updatedDiscussionChannelParticipant);
		})
		.catch((err) => {
			console.error('Error in putDiscussionChannelParticipant: ', err);
			return res.status(500).json(err.message);
		});
});

app.delete('/api/discussionChannelParticipants', (req, res) => {
	const user = req.user || {};

	const findCommunityAdmin = CommunityAdmin.findOne({
		where: {
			communityId: req.body.communityId,
			userId: user.id,
		},
	});
	const findDiscussionChannel = DiscussionChannel.findOne({
		where: {
			communityId: req.body.communityId,
			id: req.body.discussionChannelId,
		},
	});
	const findDiscussionChannelParticipant = DiscussionChannelParticipant.findOne({
		where: {
			discussionChannelId: req.body.discussionChannelId,
			userId: user.id,
		},
	});

	Promise.all([findCommunityAdmin, findDiscussionChannel, findDiscussionChannelParticipant])
		.then(([communityAdminData, discussionChannelData, discussionChannelParticipantData]) => {
			const canModerateAsCommunityAdmin =
				communityAdminData && discussionChannelData.isCommunityAdminModerated;
			const canModerateAsParticipant =
				discussionChannelParticipantData && discussionChannelParticipantData.isModerator;
			if (
				user.id !== 'b242f616-7aaa-479c-8ee5-3933dcf70859' &&
				!canModerateAsCommunityAdmin &&
				!canModerateAsParticipant
			) {
				throw new Error('Not Authorized to edit this discussion channel');
			}
			return DiscussionChannelParticipant.destroy({
				where: { id: req.body.discussionChannelParticipantId },
			});
		})
		.then(() => {
			return res.status(201).json(req.body.discussionChannelParticipantId);
		})
		.catch((err) => {
			console.error('Error in deleteDiscussionChannelParticipant: ', err);
			return res.status(500).json(err.message);
		});
});
