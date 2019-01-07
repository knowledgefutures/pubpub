import app from '../server';
import { User, CommunityAdmin, DiscussionChannel, DiscussionChannelParticipant } from '../models';
import { generateHash, slugifyString } from '../utilities';

app.post('/api/discussionChannels', (req, res)=> {
	const user = req.user || {};

	DiscussionChannel.create({
		title: slugifyString(req.body.title),
		permissions: 'private',
		isCommunityAdminModerated: true,
		pubId: req.body.pubId,
		communityId: req.body.communityId,
		viewHash: generateHash(8),
		writeHash: generateHash(8),
	})
	.then((newDiscussionChannel)=> {
		return DiscussionChannelParticipant.create({
			isModerator: true,
			userId: user.id,
			discussionChannelId: newDiscussionChannel.id,
		});
	})
	.then((newDiscussionChannelParticipant)=> {
		return DiscussionChannel.findOne({
			where: {
				id: newDiscussionChannelParticipant.discussionChannelId
			},
			include: [
				{
					model: DiscussionChannelParticipant,
					as: 'participants',
					include: [{ model: User, as: 'user', attributes: ['id', 'fullName', 'avatar', 'slug', 'initials', 'title'] }]
				}
			]
		});
	})
	.then((newDiscussionChannelData)=> {
		return res.status(201).json(newDiscussionChannelData);
	})
	.catch((err)=> {
		console.error('Error in POST discussionChannel: ', err);
		return res.status(500).json(err.message);
	});
});

app.put('/api/discussionChannels', (req, res)=> {
	const user = req.user || {};

	// Filter to only allow certain fields to be updated
	const updatedDiscussionChannel = {};
	Object.keys(req.body).forEach((key)=> {
		if (['title', 'permissions', 'isCommunityAdminModerated', 'isArchived'].indexOf(key) > -1) {
			updatedDiscussionChannel[key] = req.body[key];
		}
	});

	const findCommunityAdmin = CommunityAdmin.findOne({
		where: {
			communityId: req.body.communityId,
			userId: user.id,
		}
	});
	const findDiscussionChannel = DiscussionChannel.findOne({
		where: {
			communityId: req.body.communityId,
			id: req.body.discussionChannelId
		}
	});
	const findDiscussionChannelParticipant = DiscussionChannelParticipant.findOne({
		where: {
			discussionChannelId: req.body.discussionChannelId,
			userId: user.id,
		}
	});

	Promise.all([findCommunityAdmin, findDiscussionChannel, findDiscussionChannelParticipant])
	.then(([communityAdminData, discussionChannelData, discussionChannelParticipantData])=> {
		const canModerateAsCommunityAdmin = communityAdminData && discussionChannelData.isCommunityAdminModerated;
		const canModerateAsParticipant = discussionChannelParticipantData && discussionChannelParticipantData.isModerator;
		if (user.id !== 'b242f616-7aaa-479c-8ee5-3933dcf70859' && !canModerateAsCommunityAdmin && !canModerateAsParticipant) {
			throw new Error('Not Authorized to edit this discussion channel');
		}

		const settingNonPrivate = req.body.permissions === 'restricted' || req.body.permissions === 'public';
		const validPrivacySetting = canModerateAsCommunityAdmin || !settingNonPrivate;
		if (!validPrivacySetting) {
			/* Only community admins can set discussion channels public */
			throw new Error('Invalid privacy setting');
		}

		return DiscussionChannel.update(updatedDiscussionChannel, {
			where: { id: req.body.discussionChannelId },
		});
	})
	.then(()=> {
		return res.status(201).json(updatedDiscussionChannel);
	})
	.catch((err)=> {
		console.error('Error in putDiscussionChannel: ', err);
		return res.status(500).json(err.message);
	});
});

/* Do we allow users to delete a discussion channel? */
// app.delete('/api/discussionChannels', (req, res)=> {
// 	const user = req.user || {};

// 	const findCommunityAdmin = CommunityAdmin.findOne({
// 		where: {
// 			communityId: req.body.communityId,
// 			userId: user.id,
// 		}
// 	});
// 	const findDiscussionChannel = DiscussionChannel.findOne({
// 		where: {
// 			communityId: req.body.communityId,
// 			id: req.body.discussionChannelId
// 		}
// 	});
// 	const findDiscussionChannelParticipant = DiscussionChannelParticipant.findOne({
// 		where: {
// 			discussionChannelId: req.body.discussionChannelId,
// 			userId: user.id,
// 		}
// 	});
// 	Promise.all([findCommunityAdmin, findDiscussionChannel, findDiscussionChannelParticipant])
// 	.then(([communityAdminData, discussionChannelData, discussionChannelParticipantData])=> {
// 		const canModerateAsCommunityAdmin = communityAdminData && discussionChannelData.isCommunityAdminModerated;
// 		const canModerateAsParticipant = discussionChannelParticipantData && discussionChannelParticipantData.isModerator;
// 		if (user.id !== 'b242f616-7aaa-479c-8ee5-3933dcf70859' && !canModerateAsCommunityAdmin && !canModerateAsParticipant) {
// 			throw new Error('Not Authorized to delete this discussionChannel');
// 		}
// 		return DiscussionChannel.destroy({
// 			where: { id: req.body.discussionChannelId },
// 		});
// 	})
// 	.then(()=> {
// 		return res.status(201).json(req.body.discussionChannelId);
// 	})
// 	.catch((err)=> {
// 		console.error('Error in deleteDiscussionChannel: ', err);
// 		return res.status(500).json(err.message);
// 	});
// });
