/* eslint-disable no-console */
import Slowdance from 'slowdance';

import { Pub, Branch, Release } from 'server/models';
import { getBranchDoc } from 'server/utils/firebaseAdmin';
import { forEach } from '../util';

const handleReleasesForPub = async (pub) => {
	const releases = await Release.findAll({
		where: { pubId: pub.id },
		order: [['createdAt', 'ASC']],
	});
	if (releases.every((r) => r.historyKeyValidation === 'validated')) {
		return;
	}
	const branches = await Branch.findAll({ where: { pubId: pub.id } });
	const draftBranch = branches.find((br) => br.title === 'draft');
	const publicBranch = branches.find((br) => br.title === 'public');
	let pubError = null;
	await Promise.all(
		releases.map(async (release) => {
			try {
				const { historyKey } = release;
				const relatedMergeIndex = releases.findIndex(
					(otherRelease) => otherRelease.id === release.id,
				);

				const [{ doc: releaseDoc }, { doc: historyKeyDoc }] = await Promise.all([
					getBranchDoc(pub.id, publicBranch.id, relatedMergeIndex),
					getBranchDoc(pub.id, draftBranch.id, historyKey),
				]);

				const historyKeyMatches =
					JSON.stringify(releaseDoc) === JSON.stringify(historyKeyDoc);

				if (!historyKeyMatches) {
					pubError = new Error('Mismatched docs');
				}

				await Release.update(
					{ historyKeyValidation: historyKeyMatches ? 'validated' : 'incorrect' },
					{ where: { id: release.id } },
				);
			} catch (err) {
				pubError = err;
			}
		}),
	);
	if (pubError) {
		throw pubError;
	}
};

module.exports = async () => {
	const slowdance = new Slowdance();
	slowdance.start();
	await forEach(
		await Pub.findAll({ order: [['createdAt', 'DESC']] }),
		(pub) =>
			slowdance
				.wrapPromise(handleReleasesForPub(pub), {
					label: `[${pub.slug}] ${pub.title}`,
					labelError: (err) => err.message,
				})
				.catch(() => {}),
		10,
	);
};
