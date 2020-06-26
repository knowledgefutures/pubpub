/* eslint-disable no-console */
import { Doc } from 'server/models';
import { getBranchDoc } from 'server/utils/firebaseAdmin';

import { lookupBranch, lookupPub } from './utils/lookup';

const {
	argv: { pubId, pubSlug, branch: branchTitle = 'draft', remove },
} = require('yargs');

const main = async () => {
	const pub = await lookupPub({ id: pubId, slug: pubSlug });
	const branch = await lookupBranch({ pubId: pub.id, branchTitle: branchTitle });
	if (remove) {
		console.log('Removing maintenance doc...');
		await branch.update({ maintenanceDocId: null });
	} else {
		console.log('Downloading branch doc...');
		const { doc: content } = await getBranchDoc(pub.id, branch.id);
		console.log('Updating database...');
		const doc = await Doc.create({ content: content });
		await branch.update({ maintenanceDocId: doc.id });
	}
	console.log('Done.');
};

main().then(() => process.exit(0));
