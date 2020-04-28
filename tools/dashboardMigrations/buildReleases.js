/* eslint-disable no-console */
import { Branch, Release, Merge, PubVersion, Pub } from '../../server/models';

// TODO: There are a set of pubs (e.g. designandscience) that have changes written on their merge branch.
// As such, there is not an associated Merge of PubVersion object. We will need to go through firebase,
// find all such pubs, move changes into merges, increment the counter, and create releases.

export default async () => {
	const publicBranches = await Branch.findAll({
		where: { title: 'public' },
		attributes: ['id', 'title', 'shortId', 'firstKeyAt', 'pubId', 'createdAt'],
	});
	const pubs = await Pub.findAll({ attributes: ['id'] });
	const branchesWithFirstKey = publicBranches.filter((br) => {
		return br.firstKeyAt;
	});
	const firstKeyBranchSet = new Set();
	const publicBranchIds = new Set();
	branchesWithFirstKey.forEach((br) => {
		firstKeyBranchSet.add(br.pubId);
		publicBranchIds.add(br.id);
	});
	const existingPubIds = new Set();
	pubs.forEach((pub) => {
		existingPubIds.add(pub.id);
	});

	/* Testing the prod DB, there are no pubs who have a branchWithFirstKey */
	/* that are not captured by PubVersions or Merges. I take this to mean */
	/* that all releases are captured by those two tables, and we do not need */
	/* to query firebase */
	const uniquePubs = new Set();
	const [merges, pubVersions] = await Promise.all([Merge.findAll({}), PubVersion.findAll({})]);
	merges.forEach((merge) => uniquePubs.add(merge.pubId));
	pubVersions.forEach((pv) => uniquePubs.add(pv.pubId));
	// firstKeyBranchSet.forEach((val) => {
	// 	if (!uniquePubs.has(val)) {
	// 		console.log('uniquePubs does not have ', val);
	// 	}
	// });

	/* structure is { pubId: [pv or merge] } */
	const pvmByPub = {};
	const keyAlreadyUsed = new Set();
	[...pubVersions, ...merges]
		.filter((pvm) => {
			return (
				publicBranchIds.has(pvm.branchId) || publicBranchIds.has(pvm.destinationBranchId)
			);
		})
		.filter((pvm) => {
			/* In older versions of PubPub, it was possible to create a new Version */
			/* even though the content was unchanged. This would result in identical versions */
			/* with different timestamps, and thus different PubVersions. Let's filter out any */
			/* repeat PubVersions where the content (i.d. branch and history key) are identical */
			if (!pvm.branchId) {
				/* If it doesn't have a branchId, it's a Merge, so pass it through */
				return true;
			}
			const key = `${pvm.branchId}-${pvm.historyKey}`;
			if (keyAlreadyUsed.has(key)) {
				return false;
			}
			keyAlreadyUsed.add(key);
			return true;
		})
		.filter((pvm) => {
			/* Some pvm are pointing to Pubs that have been deleted, so filter those out */
			return existingPubIds.has(pvm.pubId);
		})
		.forEach((pvm) => {
			const currentList = pvmByPub[pvm.pubId] || [];
			currentList.push(pvm);
			pvmByPub[pvm.pubId] = currentList;
		});
	// console.log(uniquePubs.size, Object.keys(pvmByPub).length, 'Should be equal');

	const newReleases = Object.values(pvmByPub).reduce((prev, curr) => {
		const newObjects = curr
			.sort((foo, bar) => {
				if (foo.createdAt < bar.createdAt) {
					return -1;
				}
				if (foo.createdAt > bar.createdAt) {
					return 1;
				}
				return 0;
			})
			.map((item, index) => {
				/* PubVersions don't track user, so just set it to be the pubpubAdmin? */
				return {
					id: item.id,
					noteContent: item.noteContent,
					noteText: item.noteText,
					branchKey: index,
					pubId: item.pubId,
					branchId: item.branchId || item.destinationBranchId,
					userId: item.userId || 'b242f616-7aaa-479c-8ee5-3933dcf70859',
					createdAt: item.createdAt,
					updatedAt: item.updatedAt,
				};
			});
		return [...prev, ...newObjects];
	}, []);
	await Release.bulkCreate(newReleases);
};
