/* eslint-disable no-console */
import uuid from 'uuid/v4';

import { Pub, Draft, Branch } from 'server/models';

import { forEach } from '../util';

const getDraftForPub = (pub) => {
	const draftBranch = pub.branches.find((br) => br.title === 'draft');
	if (draftBranch) {
		console.log(`Found draft branch for Pub: [${pub.slug}] ${pub.title}`);
		return Draft.create({
			latestKeyAt: draftBranch.latestKeyAt,
			firebasePath: `pub-${pub.id}/branch-${draftBranch.id}`,
		});
	}
	console.warn(`No draft branch found for Pub: [${pub.slug}] ${pub.title}`);
	const id = uuid();
	return Draft.create({ id, firebasePath: `drafts/draft-${id}` });
};

const handlePub = async (pub) => {
	if (!pub.draftId) {
		const draft = await getDraftForPub(pub);
		pub.draftId = draft.id;
		await pub.save();
	}
};

export const up = async () => {
	const pubs = await Pub.findAll({
		include: [{ model: Branch, as: 'branches' }],
		order: [['createdAt', 'DESC']],
	});
	await forEach(pubs, handlePub, 10);
};
