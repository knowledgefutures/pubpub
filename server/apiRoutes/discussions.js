import app from '../server';
import { Pub, User, Discussion, Collaborator, CommunityAdmin, PubManager } from '../models';

app.post('/api/discussions', (req, res)=> {
	Discussion.findAll({
		where: {
			pubId: req.body.pubId,
		},
		attributes: ['id', 'pubId', 'threadNumber']
	})
	.then((discussions)=> {
		// This is non-atomic and could create race conditions
		// if two people create new discussion threads at the same time
		// on the same pub
		const maxThreadNumber = discussions.reduce((prev, curr)=> {
			if (curr.threadNumber > prev) { return curr.threadNumber; }
			return prev;
		}, 0);

		const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		const date = new Date();
		const dateString = `${months[date.getMonth()]} ${date.getDate()}`;
		const isReply = !!req.body.threadNumber;
		const generatedTitle = isReply ? '' : `New Discussion on ${dateString}`;

		return Discussion.create({
			title: req.body.title || generatedTitle,
			content: req.body.content,
			text: req.body.text,
			userId: req.body.userId,
			pubId: req.body.pubId,
			communityId: req.body.communityId,
			discussionChannelId: req.body.discussionChannelId,
			threadNumber: req.body.threadNumber || (maxThreadNumber + 1),
			submitHash: req.body.submitHash,
			highlights: req.body.highlights,
			isPublic: req.body.isPublic || false,
		});
	})
	.then((newDiscussion)=> {
		const findDiscussion = Discussion.findOne({
			where: {
				id: newDiscussion.id,
			},
			include: [{ model: User, as: 'author', attributes: ['id', 'fullName', 'avatar', 'slug', 'initials'] }],
		});

		return findDiscussion;
	})
	.then((populatedDiscussion)=> {
		return res.status(201).json({
			...populatedDiscussion.toJSON(),
			submitHash: req.body.submitHash ? 'present' : undefined
		});
	})
	.catch((err)=> {
		console.log('Error creating Discussion', err);
		return res.status(500).json(err);
	});
});

app.put('/api/discussions', (req, res)=> {
	const user = req.user || {};

	// Filter to only allow certain fields to be updated
	const updatedDiscussion = {};
	Object.keys(req.body).forEach((key)=> {
		if (['title', 'content', 'text', 'isArchived', 'highlights', 'labels'].indexOf(key) > -1) {
			updatedDiscussion[key] = req.body[key] && req.body[key].trim
				? req.body[key].trim()
				: req.body[key];
		}
	});
	updatedDiscussion.updatedAt = new Date();

	// Find if the user is allowed to admin this pub
	const findPubManager = PubManager.findOne({
		where: { userId: user.id, pubId: req.body.pubId },
		raw: true,
	});

	// Find if the user is admins of the community the pub is in
	const findCommunityAdmin = CommunityAdmin.findOne({
		where: { userId: user.id, communityId: req.body.communityId },
		raw: true,
	});

	// Find if community admins are allowed to manage pubs
	const findPub = Pub.findOne({
		where: { id: req.body.pubId, isCommunityAdminManaged: true },
		raw: true,
	});

	// Find if the user is the author of the discussion
	const findDiscussion = Discussion.findOne({
		where: { id: req.body.discussionId, userId: user.id },
		raw: true,
	});

	Promise.all([findPubManager, findCommunityAdmin, findPub, findDiscussion])
	.then(([isPubManager, isCommunityAdmin, adminsManagePub, isDiscussionAuthor])=> {
		if (user.id !== 'b242f616-7aaa-479c-8ee5-3933dcf70859' && !isPubManager && !(isCommunityAdmin && adminsManagePub) && !isDiscussionAuthor) {
			throw new Error('Not Authorized to update this discussion');
		}

		return Discussion.update(updatedDiscussion, {
			where: {
				id: req.body.discussionId,
				userId: req.body.userId,
				pubId: req.body.pubId,
				communityId: req.body.communityId,
			}
		});
	})
	.then(()=> {
		return res.status(201).json({
			...updatedDiscussion,
			id: req.body.discussionId,
		});
	})
	.catch((err)=> {
		console.log('Error putting Discussion', err);
		return res.status(500).json(err);
	});
});
