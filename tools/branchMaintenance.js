/* eslint-disable no-console */
import { Branch, Pub, Doc } from 'server/models';
import { getBranchDoc } from 'server/utils/firebaseAdmin';

const {
	argv: { pubId, pubSlug, branch: branchTitle = 'draft', remove },
} = require('yargs');

const main = async () => {
	const pub = await Pub.findOne({
		where: {
			...(pubId && { id: pubId }),
			...(pubSlug && { slug: pubSlug }),
		},
	});
	if (!pub) {
		throw new Error('No matching Pub found');
	}
	const branch = await Branch.findOne({
		where: { pubId: pub.id, title: branchTitle },
	});
	if (!branch) {
		throw new Error(`No branch by name ${branchTitle} for Pub ${pub.slug}.`);
	}
	if (remove) {
		console.log('Removing maintenance doc...');
		await branch.update({ maintenanceDocId: null });
	} else {
		console.log('Downloading branch doc...');
		const content = await getBranchDoc(pub.id, branch.id);
		console.log('Updating database...');
		const doc = await Doc.create({ content: content });
		await branch.update({ maintenanceDocId: doc.id });
	}
	console.log('Done.');
};

main().then(() => process.exit(0));
