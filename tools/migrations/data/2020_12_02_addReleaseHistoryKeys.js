/* eslint-disable no-console */
import Slowdance from 'slowdance';

import { Pub, Release } from 'server/models';
import { getBranchRef } from 'server/utils/firebaseAdmin';
import { forEach } from '../util';

const assertMonotonic = (values, kind) => {
	for (let i = 0; i < values.length - 1; i++) {
		const one = values[i];
		const two = values[i + 1];
		const monotonic = one <= two;
		if (!monotonic) {
			throw new Error(`${kind} sequence ${values} is not monotonic`);
		}
	}
};

const getLatestChangeTimeInMerge = (merge) => {
	const changes = Object.values(merge);
	if (changes.length === 0) {
		throw new Error('Empty merge');
	}
	return changes.reduce((latest, change) => {
		if (typeof change.t !== 'number') {
			throw new Error('Child of merge does not appear to be a change');
		}
		const { t } = change;
		return Math.max(latest, t);
	}, 0);
};

const getBestHistoryKeyForRelease = (release, keyTimePairs, historyKeyUpperBound) => {
	assertMonotonic(
		keyTimePairs.map((p) => p.latestChangeAt),
		'latestChangeAt',
	);
	const releaseTime = new Date(release.createdAt).valueOf();
	const latestPairBeforeRelease = keyTimePairs.reduce((best, next) => {
		const { latestChangeAt, historyKey } = next;
		const doesNotViolateUpperBound = historyKey <= historyKeyUpperBound;
		const isRoughlyBeforeRelease =
			latestChangeAt < releaseTime || Math.abs(latestChangeAt - releaseTime) <= 60 * 1000;
		const isBetter = !best || next.latestChangeAt > best.latestChangeAt;
		if (isRoughlyBeforeRelease && doesNotViolateUpperBound && isBetter) {
			return next;
		}
		return best;
	});
	return latestPairBeforeRelease.historyKey;
};

const getHistoryKeysForReleases = (releases, keyTimePairs) => {
	if (keyTimePairs.length === releases.length) {
		const keys = keyTimePairs.map((p) => p.historyKey);
		return { keys: keys, confidence: '✅' };
	}
	let confidence = '⚠️';
	const keys = releases.map((release, index) => {
		const { branchKey } = release;
		if (typeof branchKey === 'number') {
			if (branchKey >= keyTimePairs.length) {
				confidence += '🚨';
				return keyTimePairs[keyTimePairs.length - 1].historyKey;
			}
			return keyTimePairs[branchKey].historyKey;
		}
		confidence += '🔮';
		const upperBoundFromSourceBranchKeys = Math.min(
			Infinity,
			...releases
				.slice(index + 1)
				.map((r) => r.sourceBranchKey)
				.filter((k) => typeof k === 'number'),
		);
		return getBestHistoryKeyForRelease(release, keyTimePairs, upperBoundFromSourceBranchKeys);
	});
	return { keys: keys, confidence: confidence };
};

const addHistoryKeysToReleases = async (pubId, releaseBranchId, releases) => {
	const firebaseRef = getBranchRef(pubId, releaseBranchId);

	const mergesSnapshot = await firebaseRef.child('merges').once('value');
	const merges = mergesSnapshot.val();

	if (merges) {
		const keyTimePairs = [];
		let runningHistoryKey = -1;

		Object.keys(merges)
			.sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
			.forEach((key) => {
				const merge = merges[key];
				const mergeLength = Object.keys(merge).length;
				const latestChangeTimeInMerge = getLatestChangeTimeInMerge(merge);
				runningHistoryKey += mergeLength;
				keyTimePairs.push({
					historyKey: runningHistoryKey,
					latestChangeAt: latestChangeTimeInMerge,
				});
			});

		assertMonotonic(
			releases.map((release) => new Date(release.createdAt).valueOf()),
			'release time',
		);

		assertMonotonic(
			keyTimePairs.map((p) => p.historyKey),
			'historyKey',
		);

		const { keys: releaseHistoryKeys, confidence } = getHistoryKeysForReleases(
			releases,
			keyTimePairs,
		);

		await Promise.all(
			releases.map(async (release, index) => {
				const historyKey = releaseHistoryKeys[index];
				if (typeof historyKey !== 'number') {
					throw new Error(`Release at index=${index} somehow missing key`);
				}
				await Release.update({ historyKey: historyKey }, { where: { id: release.id } });
			}),
		);

		const latestReleaseTime = new Date(releases.concat().pop().createdAt).valueOf();
		const latestKeyTimePair = keyTimePairs.concat().pop();
		const latestReleaseHistoryKey = releaseHistoryKeys.concat().pop();
		if (latestReleaseHistoryKey !== latestKeyTimePair.historyKey) {
			throw new Error(
				`Latest release (key=${latestReleaseHistoryKey}, time=${new Date(
					latestReleaseTime,
				)}) does not take latest history key (key=${
					latestKeyTimePair.historyKey
				}, time=${new Date(latestKeyTimePair.latestChangeAt)})`,
			);
		}

		assertMonotonic(releaseHistoryKeys, 'key');
		return confidence;
	}
	throw new Error('No merges');
};

const releaseHasValidHistoryKey = (release) => {
	return typeof release.historyKey === 'number' && release.historyKey !== -1;
};

const handlePub = async (pub) => {
	const releases = await Release.findAll({
		where: { pubId: pub.id },
		order: [['createdAt', 'ASC']],
	});
	if (releases.length > 0) {
		if (new Set(releases.map((r) => r.branchId)).size > 1) {
			throw new Error('Pub has releases from multiple branches');
		}
		if (releases.every(releaseHasValidHistoryKey)) {
			return '🥚';
		}
		const releaseBranchId = releases[0].branchId;
		return addHistoryKeysToReleases(pub.id, releaseBranchId, releases);
	}
	return '📝';
};

module.exports = async () => {
	const slowdance = new Slowdance();
	slowdance.start();

	await forEach(
		await Pub.findAll({ order: [['createdAt', 'DESC']] }),
		async (pub) =>
			slowdance
				.wrapPromise(handlePub(pub), {
					label: `[${pub.slug}] ${pub.title}`,
					labelResult: (res) => res.toString(),
					labelError: (err) => `(${err.message})`,
				})
				.catch(() => {}),

		10,
	);
};
