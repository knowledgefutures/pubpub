/* eslint-disable no-console */
import { Op } from 'sequelize';
import { uncompressSelectionJSON } from 'prosemirror-compress-pubpub';

import { Anchor, Branch, Pub, Release, Discussion } from 'server/models';
import { getDatabaseRef } from 'server/utils/firebaseAdmin';
import { createOriginalDiscussionAnchor } from 'server/discussionAnchor/queries';

import { forEach } from '../util';

const getAnchorDescsFromSingleFirebaseDiscussion = (
	discussionId,
	firebaseDiscussion,
	isPublicBranch,
) => {
	if (firebaseDiscussion) {
		const { currentKey, selection: compressedSelection } = firebaseDiscussion;
		const selection = uncompressSelectionJSON(compressedSelection);
		return [
			{
				source: 'firebase-current',
				discussionId,
				historyKey: currentKey,
				head: selection.head,
				anchor: selection.anchor,
				isPublicBranch,
			},
		];
	}
	return [];
};
const getAnchorDescsFromFirebaseDiscussions = ({
	discussions,
	firebaseDiscussions,
	isPublicBranch,
}) => {
	return discussions
		.map((discussion) =>
			getAnchorDescsFromSingleFirebaseDiscussion(
				discussion.id,
				firebaseDiscussions[discussion.id],
				isPublicBranch,
			),
		)
		.reduce((a, b) => [...a, ...b], []);
};

const mapAnchorDescsToDraft = (anchorDescs, releases) => {
	return anchorDescs.map((anchor) => {
		const { isPublicBranch, historyKey, source } = anchor;
		if (isPublicBranch) {
			const correspondingRelease = releases[Math.min(historyKey, releases.length - 1)];
			if (correspondingRelease) {
				const draftKey = correspondingRelease.historyKey;
				return { ...anchor, historyKey: draftKey, source: `mapped-${source}` };
			}
		}
		return anchor;
	});
};

const dedupeAnchorDescs = (descs) => {
	const uniqueDescsByKey = {};
	descs.forEach((desc) => {
		const { head, anchor, discussionId, historyKey, source } = desc;
		const key = `${discussionId}__${historyKey}`;
		const currentDesc = uniqueDescsByKey[key];
		if (currentDesc) {
			const { anchor: hasAnchor, head: hasHead, source: hasSource } = currentDesc;
			if (head !== hasHead || anchor !== hasAnchor) {
				console.warn(
					`Found disagreeing (head, anchor) for ${discussionId} at ${historyKey}: (${hasSource}, ${hasAnchor}, ${hasHead}), (${source}, ${anchor}, ${head})`,
				);
			} else {
				uniqueDescsByKey[key] = currentDesc.exact ? currentDesc : desc;
			}
		} else {
			uniqueDescsByKey[key] = desc;
		}
	});
	return Object.values(uniqueDescsByKey);
};

const createAnchorModelFromDesc = (desc) => {
	const { discussionId, head, anchor, historyKey, prefix, suffix, exact } = desc;
	return createOriginalDiscussionAnchor({
		discussionId,
		historyKey,
		originalText: exact,
		originalTextSuffix: suffix,
		originalTextPrefix: prefix,
		selectionJson: { type: 'text', head, anchor },
	});
};

const handlePub = async (pub) => {
	const [branches, releases, discussions] = await Promise.all([
		Branch.findAll({ where: { pubId: pub.id } }),
		Release.findAll({ where: { pubId: pub.id }, order: [['historyKey', 'ASC']] }),
		Discussion.findAll({
			where: { pubId: pub.id },
			include: [{ model: Anchor, as: 'anchor' }],
		}),
	]);
	const anchorDescs = [];
	const publicBranch = branches.find((br) => br.title === 'public');
	// Retrieve all anchors from Firebase
	await forEach(branches, async (branch) => {
		const branchRef = getDatabaseRef(`pub-${pub.id}/branch-${branch.id}`);
		const discussionsSnapshot = await branchRef.child('discussions').once('value');
		const firebaseDiscussions = discussionsSnapshot.val() || {};
		const isPublicBranch = branch === publicBranch;
		const branchAnchorDescs = getAnchorDescsFromFirebaseDiscussions({
			discussions,
			firebaseDiscussions,
			isPublicBranch,
		});
		anchorDescs.push(...branchAnchorDescs);
	});
	// Get all anchors from associated discussion.anchor models
	const anchorModelDescs = discussions
		.map((discussion) => {
			const { anchor } = discussion;
			if (anchor) {
				const { from, to, prefix, suffix, exact, branchId, branchKey } = anchor;
				return {
					discussionId: discussion.id,
					anchor: from,
					head: to,
					prefix,
					suffix,
					exact,
					isPublicBranch: branchId === publicBranch.id,
					historyKey: branchKey,
					source: 'model',
				};
			}
			return null;
		})
		.filter((x) => x);
	anchorDescs.push(...anchorModelDescs);
	const draftMappedAnchorDescs = mapAnchorDescsToDraft(anchorDescs, releases);
	const dedupedAnchorDescs = dedupeAnchorDescs(draftMappedAnchorDescs);
	await Promise.all(dedupedAnchorDescs.map(createAnchorModelFromDesc));
	console.log(pub.id);
};

module.exports = async () => {
	const discussions = await Discussion.findAll({ attributes: ['id', 'pubId'] });
	const pubIdsWithDiscussions = [...new Set(discussions.map((d) => d.pubId))];
	const pubs = await Pub.findAll({ where: { id: { [Op.in]: pubIdsWithDiscussions } } });
	await forEach(pubs, (p) => handlePub(p).catch((err) => console.error(err)), 10);
};
