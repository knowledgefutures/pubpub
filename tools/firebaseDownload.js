/* eslint-disable no-console */
import fs from 'fs-extra';

import { Branch, Pub } from 'server/models';
import { getBranchDoc, getPubRef } from 'server/utils/firebaseAdmin';

const {
	argv: { pubId, pubSlug, branch: branchTitle = 'draft', output, doc: downloadDoc },
} = require('yargs');

const main = async () => {
	const pub = await Pub.findOne({
		where: {
			...(pubId && { id: pubId }),
			...(pubSlug && { slug: pubSlug }),
		},
	});
	if (!pub) {
		throw new Error(`No matching Pub found.`);
	}
	if (downloadDoc) {
		const branch = await Branch.findOne({
			where: { pubId: pub.id, title: branchTitle },
		});
		if (!branch) {
			throw new Error(`No branch by name ${branchTitle} for Pub ${pub.slug}.`);
		}
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
