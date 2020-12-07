import { getExportFormatDetails } from 'utils/export/formats';
import { getBranchDoc } from 'server/utils/firebaseAdmin';

import { renderStaticHtml } from './html';
import { getPubMetadata } from './metadata';
import { getNotesData } from './notes';
import { callPaged } from './paged';
import { callPandoc } from './pandoc';
import {
	getExportById,
	getTmpFileForExtension,
	uploadDocument,
	writeToFile,
	assignFileToExportById,
} from './util';

export const exportTask = async ({ exportId }, collectSubprocess) => {
	const { pubId, branchId, format, historyKey } = await getExportById(exportId);
	const { extension, pandocTarget, pagedTarget } = getExportFormatDetails(format);
	const tmpFile = await getTmpFileForExtension(extension);
	const pubMetadata = await getPubMetadata(pubId);
	// @ts-expect-error ts-migrate(2554) FIXME: Expected 5 arguments, but got 3.
	const { doc: pubDoc } = await getBranchDoc(pubId, branchId, historyKey);
	const notesData = await getNotesData(pubMetadata, pubDoc);
	const staticHtml = await renderStaticHtml({
		pubDoc: pubDoc,
		notesData: notesData,
		pubMetadata: pubMetadata,
		targetPandoc: !!pandocTarget,
		targetPaged: !!pagedTarget,
	});
	if (pandocTarget) {
		await callPandoc({
			staticHtml: staticHtml,
			pubMetadata: pubMetadata,
			tmpFile: tmpFile,
			pandocTarget: pandocTarget,
		});
	} else if (pagedTarget) {
		await callPaged(staticHtml, tmpFile, collectSubprocess);
	} else {
		await writeToFile(staticHtml, tmpFile);
	}
	const url = await uploadDocument(branchId, tmpFile, extension);
	await assignFileToExportById(exportId, url);
	return { url: url };
};
