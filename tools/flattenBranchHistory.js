import fs from 'fs-extra';
import Promise from 'bluebird';
import { Node, Fragment, Slice } from 'prosemirror-model';
import { ReplaceStep } from 'prosemirror-transform';

import { getBranchRef } from 'server/utils/firebaseAdmin';
import { isProd } from 'utils/environment';
import { buildSchema, createFirebaseChange } from 'components/Editor/utils';

import { lookupBranch, lookupPub } from './utils/lookup';
import { promptOkay } from './utils/prompt';

const documentSchema = buildSchema();

const {
	argv: { pubId, pubSlug, branch: branchTitle = 'draft', doc: docPath, theSlowWay },
} = require('yargs');

const prodWarning = isProd() ? ' IN PRODUCTION' : '';

const removeBranchContents = async (branchRef) => {
	if (theSlowWay) {
		const changesRef = branchRef.child('changes');
		await new Promise((resolve) => {
			const removeChangeAtIndex = async (index) => {
				const changeRef = changesRef.child(index.toString());
				const changeSnap = await changeRef.once('value');
				const val = changeSnap.val();
				if (val) {
					// eslint-disable-next-line no-console
					console.log(`Removing change at ${index}`);
					await changeRef.remove();
					await removeChangeAtIndex(index + 1);
				} else {
					// eslint-disable-next-line no-console
					console.log(`No change at key ${index}, terminating`);
					resolve();
				}
			};
			removeChangeAtIndex(0);
		});
	}
	await branchRef.remove();
};

const writeToBranchRef = async (branchRef, document, branchId) => {
	await removeBranchContents(branchRef);
	const hydratedDocument = Node.fromJSON(documentSchema, document);
	const documentSlice = new Slice(Fragment.from(hydratedDocument.content), 0, 0);
	const replaceStep = new ReplaceStep(0, 0, documentSlice);
	const change = createFirebaseChange([replaceStep], branchId, 'flatten-branch-history');
	await branchRef.set({ changes: [change] });
};

const main = async () => {
	const pub = await lookupPub({ id: pubId, slug: pubSlug });
	const branch = await lookupBranch({ pubId: pub.id, branchTitle: branchTitle });
	const docFile = await fs.readFile(docPath);
	const document = JSON.parse(docFile);
	await promptOkay(
		`Really wipe the history of ${pub.slug}.${branchTitle}${prodWarning} and replace it with the document at ${docPath}?`,
		{ throwIfNo: true, yesIsDefault: false },
	);
	const branchRef = getBranchRef(pub.id, branch.id);
	await writeToBranchRef(branchRef, document, branch.id);
	// eslint-disable-next-line no-console
	console.log('It is Finished');
};

main().then(() => process.exit(0));
