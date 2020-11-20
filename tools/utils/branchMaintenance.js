/* eslint-disable no-console */
import { Doc } from 'server/models';
import { getBranchDoc } from 'server/utils/firebaseAdmin';

import { lookupBranch, lookupPub } from './lookup';

export const setBranchMaintenanceMode = async ({ pubId, pubSlug, branchTitle, remove }) => {
	const pub = await lookupPub({ id: pubId, slug: pubSlug });
	const branch = await lookupBranch({ pubId: pub.id, branchTitle: branchTitle });
	if (branch) {
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
	} else {
		console.log(`No branch by name ${branchTitle}`);
	}
};
