import { getExportFormatDetails } from 'utils/export/formats';
import { getPubDraftDoc } from 'server/utils/firebaseAdmin';

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
	const { pubId, format, historyKey } = await getExportById(exportId);
	const { extension, pandocTarget, pagedTarget } = getExportFormatDetails(format);
	const tmpFile = await getTmpFileForExtension(extension);
	const pubMetadata = await getPubMetadata(pubId);
	const { doc: pubDoc } = await getPubDraftDoc(pubId, historyKey);
	const notesData = await getNotesData(pubMetadata, pubDoc);
	if (pandocTarget) {
		await callPandoc({
			pubDoc,
			pubMetadata,
			tmpFile,
			pandocTarget,
			notesData,
		});
	} else {
		const staticHtml = await renderStaticHtml({
			pubDoc,
			notesData,
			pubMetadata,
		});
		if (pagedTarget) {
			await callPaged(staticHtml, tmpFile, collectSubprocess);
		} else {
			await writeToFile(staticHtml, tmpFile);
		}
	}
	const url = await uploadDocument(pubId, tmpFile, extension);
	await assignFileToExportById(exportId, url);
	return { url };
};
