/* eslint-disable no-console */
import fs from 'fs-extra';

import { getBranchDoc, getPubRef } from 'server/utils/firebaseAdmin';

import { lookupBranch, lookupPub } from './utils/lookup';

const {
	argv: { pubId, pubSlug, branch: branchTitle = 'draft', output, doc: downloadDoc },
} = require('yargs');

const main = async () => {
	const pub = await lookupPub({ id: pubId, slug: pubSlug });
	if (downloadDoc) {
		const branch = await lookupBranch({ pubId: pub.id, branchTitle: branchTitle });
		console.log('Loading doc...');
		const branchDoc = await getBranchDoc(pub.id, branch.id);
		console.log('Stringifying doc...');
		const outputString = JSON.stringify(branchDoc);
		console.log('Writing doc to file...');
		await fs.writeFile(output, outputString);
	} else {
		console.log('Loading Pub...');
		const firebasePub = await getPubRef(pub.id).once('value');
		console.log('Stringifying Pub...');
		const outputString = JSON.stringify(firebasePub);
		console.log('Writing Pub to file...');
		await fs.writeFile(output, outputString);
	}
	console.log('Done.');
};

main().finally(() => process.exit(0));
