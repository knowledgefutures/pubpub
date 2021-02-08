/* eslint-disable no-console */
import { Op } from 'sequelize';

import { Branch, Release } from 'server/models';
import { getBranchDoc, getBranchRef } from 'server/utils/firebaseAdmin';
import { forEach } from '../util';

const MIGRATION_STEP_SKIP = Symbol('skip me!');

const getLatestChangeForMerge = (merge) => {
	const keys = Object.keys(merge);

	if (keys.length === 0) {
		throw new Error('Empty merge');
	}

	const highestKey = keys.map((key) => parseInt(key, 10)).reduce((a, b) => Math.max(a, b), -1);
	return merge[highestKey.toString()];
};

const getLatestChangeForEachMerge = async (branchRef) => {
	const mergesSnapshot = await branchRef.child('merges').once('value');
	const merges = mergesSnapshot.val();
	if (!merges) {
		throw new Error('No merges');
	}
	return Object.keys(merges)
		.sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
		.map((key) => getLatestChangeForMerge(merges[key]));
};

const getChangeKeyForChangeInMerge = async (branchRef, changeFromMerge) => {
	const changesSnapshot = await branchRef.child('changes').once('value');
	const changes = changesSnapshot.val();
	const changeKeys = Object.keys(changes).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
	const changeIds = changeKeys.map((key) => changes[key].id.toLowerCase());
	return changeIds.indexOf(changeFromMerge.id.toLowerCase());
};

const assertMonotonic = (values, kind) => {
	console.log(values);
	for (let i = 0; i < values.length - 1; i++) {
		const one = values[i];
		const two = values[i + 1];
		const monotonic = one <= two;
		if (!monotonic) {
			throw new Error(`${kind} sequence ${values} is not monotonic`);
		}
	}
};

const getNextReleaseKeysForReleases = ({
	releasesOrderedByDate,
	proposedKeys,
	pubId,
	draftBranch,
	publicBranch,
}) => {
	return Promise.all(
		releasesOrderedByDate.map(async (release, index) => {
			if (release.historyKeyValidation === 'incorrect' || release.historyKey === -1) {
				const proposedKey = proposedKeys[index] || proposedKeys[proposedKeys.length - 1];
				if (proposedKey === MIGRATION_STEP_SKIP) {
					return MIGRATION_STEP_SKIP;
				}
				if (typeof proposedKey === 'number') {
					const [{ doc: releaseDoc }, { doc: draftDoc }] = await Promise.all([
						getBranchDoc(pubId, publicBranch.id, index),
						getBranchDoc(pubId, draftBranch.id, proposedKey),
					]);
					const isMatch = JSON.stringify(releaseDoc) === JSON.stringify(draftDoc);
					if (isMatch) {
						return proposedKey;
					}
				}
			}
			return release.historyKey;
		}),
	);
};

const updateReleasesWithNewKeys = (releasesOrderedByDate, proposedKeys) => {
	return Promise.all(
		releasesOrderedByDate.map(async (release, index) => {
			const proposedKey = proposedKeys[index];
			if (proposedKey === release.historyKey) {
				console.log('Not changing key');
			} else if (typeof proposedKey === 'number') {
				if (release.historyKeyValidation === 'validated') {
					console.log(`Refusing to update validated history key for index=${index}`);
				} else {
					console.log(
						`[${release.pubId}] updating historyKey ${release.historyKey} -> ${proposedKey} for index=${index}`,
					);
					await Release.update(
						{ historyKeyValidation: 'validated', historyKey: proposedKey },
						{ where: { id: release.id } },
					);
				}
			} else if (proposedKey === MIGRATION_STEP_SKIP) {
				console.log('Legacy migration step found. Giving up.');
				await Release.update(
					{ historyKeyValidation: 'legacy-migration-merge' },
					{ where: { id: release.id } },
				);
			} else {
				console.log(`Not a valid history key: ${proposedKey}`);
			}
		}),
	);
};

const handleReleasesForPub = async (pubId) => {
	const releasesOrderedByDate = await Release.findAll({
		where: { pubId },
		order: [['createdAt', 'ASC']],
	});

	if (releasesOrderedByDate.every((r) => r.historyKeyValidation === 'validated')) {
		return;
	}

	const branches = await Branch.findAll({ where: { pubId } });
	console.log(
		'Branches:',
		branches.map((b) => b.title),
	);

	const draftBranch = branches.find((br) => br.title === 'draft');
	const publicBranch = branches.find((br) => br.title === 'public');

	const draftRef = getBranchRef(pubId, draftBranch.id);
	const publicRef = getBranchRef(pubId, publicBranch.id);

	const latestChangesForMerges = await getLatestChangeForEachMerge(publicRef);
	const changeKeysForMerges = await Promise.all(
		latestChangesForMerges.map((change) => {
			if (change.cId.includes('migr8')) {
				return MIGRATION_STEP_SKIP;
			}
			return getChangeKeyForChangeInMerge(draftRef, change);
		}),
	);

	const nextHistoryKeys = await getNextReleaseKeysForReleases({
		releasesOrderedByDate,
		proposedKeys: changeKeysForMerges,
		pubId,
		draftBranch,
		publicBranch,
	});
	assertMonotonic(nextHistoryKeys.filter((k) => typeof k === 'number' && k !== -1));
	await updateReleasesWithNewKeys(releasesOrderedByDate, nextHistoryKeys);
};

module.exports = async () => {
	const releases = await Release.findAll(
		{ where: { [Op.or]: [{ historyKeyValidation: 'incorrect' }] } },
		{ order: [['createdAt', 'DESC']] },
	);
	const pubIds = [...new Set(releases.map((r) => r.pubId))];
	console.log(pubIds.length);
	await forEach(pubIds, (pubId) => handleReleasesForPub(pubId).catch((e) => console.error(e)));
};
