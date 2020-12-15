/* eslint-disable no-console */
import Slowdance from 'slowdance';

import { Pub, Branch, Release } from 'server/models';
import { getBranchDoc } from 'server/utils/firebaseAdmin';
import { createDoc } from 'server/doc/queries';
import { forEach } from '../util';

const handleReleasesForPub = async (pub) => {
	const [publicBranch, releasesOrderedByDate] = await Promise.all([
		Branch.findOne({
			where: { pubId: pub.id, title: 'public' },
		}),
		Release.findAll({
			where: { pubId: pub.id },
			order: [['createdAt', 'ASC']],
		}),
	]);
	await Promise.all(
		releasesOrderedByDate.map(async (release, index) => {
			if (!release.docId) {
				const docContent = await getBranchDoc(pub.id, publicBranch.id, index);
				const docModel = await createDoc(docContent);
				await Release.update({ docId: docModel.id }, { where: { id: release.id } });
			}
		}),
	);
};

module.exports = async () => {
	const slowdance = new Slowdance();
	slowdance.start();
	await forEach(await Pub.findAll({ order: [['createdAt', 'DESC']] }), (pub) =>
		slowdance
			.wrapPromise(handleReleasesForPub(pub), {
				label: `[${pub.slug}] ${pub.title}`,
				labelError: (err) => err.message,
			})
			.catch(() => {}),
	);
};
