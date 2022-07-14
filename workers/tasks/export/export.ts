import { getExportFormatDetails } from 'utils/export/formats';
import { getPubDraftDoc } from 'server/utils/firebaseAdmin';
import { Maybe } from 'types';

import { renderStaticHtml } from './html';
import { getPubMetadata } from './metadata';
import { getNotesData } from './notes';
import { exportWithPaged } from './paged';
import { exportWithPandoc } from './pandoc';
import {
	getExportById,
	getTmpFileForExtension,
	uploadDocument,
	writeToFile,
	assignFileToExportById,
} from './util';

export const exportTask = async ({ exportId }) => {
	const { pubId, format, historyKey } = await getExportById(exportId);
	const { extension, pandocTarget, pagedTarget } = getExportFormatDetails(format);
	const tmpFile = await getTmpFileForExtension(extension);
	const pubMetadata = await getPubMetadata(pubId);
	const { doc: pubDoc } = await getPubDraftDoc(pubId, historyKey);
	const notesData = await getNotesData(pubMetadata, pubDoc);

	let url: Maybe<string>;

	if (pandocTarget) {
		await exportWithPandoc({
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
			url = (await exportWithPaged(staticHtml)).url;
		} else {
			await writeToFile(staticHtml, tmpFile);
		}
	}
	if (url === undefined) {
		url = (await uploadDocument(pubId, tmpFile, extension)) as string;
	}
	await assignFileToExportById(exportId, url);
	return { url };
};
