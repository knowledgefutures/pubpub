import app from '../server';
import { Pub, Version, CommunityAdmin, Discussion, PubManager } from '../models';
import { submitDoiData, generateHash } from '../utilities';

app.post('/api/versions', (req, res)=> {
	const user = req.user || {};

	const findPubManager = PubManager.findOne({
		where: {
			userId: user.id,
			pubId: req.body.pubId,
		}
	});
	const findCommunityAdmin = CommunityAdmin.findOne({
		where: {
			userId: req.user && req.user.id,
			communityId: req.body.communityId || null,
		}
	});
	const findPub = Pub.findOne({
		where: { id: req.body.pubId, communityId: req.body.communityId },
	});

	const currentTimestamp = new Date();
	let firstPublishedAtValue;

	Promise.all([findPubManager, findCommunityAdmin, findPub])
	.then(([pubManagerData, communityAdminData, pubData])=> {
		const accessAsCommunityAdmin = communityAdminData && pubData.isCommunityAdminManaged;

		if (user.id !== 'b242f616-7aaa-479c-8ee5-3933dcf70859'
			&& !accessAsCommunityAdmin
			&& !pubManagerData
		) {
			throw new Error('Not Authorized to update this pub');
		}
		firstPublishedAtValue = pubData.firstPublishedAt;
		return Version.create({
			pubId: req.body.pubId,
			content: req.body.content,
			viewHash: generateHash(8),
			isPublic: req.body.isPublic || false,
		});
	})
	.then(()=> {
		const updatePub = Pub.update({
			firstPublishedAt: firstPublishedAtValue || currentTimestamp,
			lastPublishedAt: currentTimestamp,
		}, {
			where: { id: req.body.pubId }
		});

		return updatePub;
	})
	.then(()=> {
		const updateDiscussion = Discussion.update({ isArchived: true, submitApprovedAt: currentTimestamp }, {
			where: {
				submitHash: req.body.submitHash,
				pubId: req.body.pubId,
				communityId: req.body.communityId || null,
				isArchived: { $not: true },
			}
		});
		const updateDoiData = submitDoiData(req.body.pubId, req.body.communityId, false);
		return Promise.all([updateDiscussion, updateDoiData]);
	})
	.then(()=> {
		return res.status(201).json('Version Published Successfully');
	})
	.catch((err)=> {
		console.error('Error in postVersion: ', err);
		return res.status(500).json(err.message);
	});
});

app.put('/api/versions', (req, res)=> {
	const user = req.user || {};

	/* Filter to only allow certain fields to be updated */
	const updatedVersion = {};
	Object.keys(req.body).forEach((key)=> {
		if (['isPublic', 'isCommunityAdminShared'].indexOf(key) > -1) {
			updatedVersion[key] = req.body[key];
		}
	});

	const findCommunityAdmin = CommunityAdmin.findOne({
		where: {
			communityId: req.body.communityId,
			userId: user.id,
		}
	});
	const findPubManager = PubManager.findOne({
		where: {
			pubId: req.body.pubId,
			userId: user.id
		},
	});
	Promise.all([findCommunityAdmin, findPubManager])
	.then(([communityAdminData, pubManagerData])=> {
		if (user.id !== 'b242f616-7aaa-479c-8ee5-3933dcf70859'
			&& !communityAdminData
			&& !pubManagerData
		) {
			throw new Error('Not Authorized to edit this pub');
		}
		return Version.update(updatedVersion, {
			where: { id: req.body.versionId },
		});
	})
	.then(()=> {
		return res.status(201).json(updatedVersion);
	})
	.catch((err)=> {
		console.error('Error in putVersion: ', err);
		return res.status(500).json(err.message);
	});
});
