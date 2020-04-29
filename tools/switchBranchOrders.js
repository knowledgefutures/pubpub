/* eslint-disable no-console */
import { Pub, Branch } from '../server/models';

const fixPubBranchOrders = async (pub) => {
	console.log('Fixing pub id', pub.id);
	const branches = await Branch.findAll({ where: { pubId: pub.id } });
	// Update the orders of #public and #draft so that #public is first
	const publicBranch = branches.find((br) => br.title === 'public');
	const draftBranch = branches.find((br) => br.title === 'draft');
	if (publicBranch) {
		await publicBranch.update({ order: 0.5 });
	} else {
		console.log('-- Warning: no #public branch');
	}
	if (draftBranch) {
		await draftBranch.update({ order: 0.9 });
	} else {
		console.log('-- Warning: no #draft branch');
	}
};

const main = async () => {
	const pubs = await Pub.findAll({ attributes: ['id'] });
	await pubs.reduce((promise, pub) => {
		return promise.then(() => fixPubBranchOrders(pub)).catch((e) => console.log('Error:', e));
	}, Promise.resolve());
	// const setPublicBranches = await Branch.update({ order: 0.01 }, { where: { title: 'public' } });
	process.exit();
};

main();
