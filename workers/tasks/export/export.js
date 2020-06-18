import { getExportFormatDetails } from 'utils/export/formats';

import { createStaticHtml } from './html';
import { getPubMetadata } from './metadata';
import { callPandoc } from './pandoc';
import { getProsemirrorPubData } from './prosemirror';
import {
	getExportById,
	getTmpFileForExtension,
	uploadDocument,
	writeToFile,
	assignFileToExportById,
} from './util';
import { callPaged } from './paged';

export const exportTask = async ({ exportId }, collectSubprocess) => {
	const { pubId, branchId, format, historyKey } = await getExportById(exportId);
	const { extension, pandocTarget, pagedTarget } = getExportFormatDetails(format);
	const tmpFile = await getTmpFileForExtension(extension);
	const pubMetadata = await getPubMetadata(pubId);
	const { prosemirrorDoc, citations, footnotes } = await getProsemirrorPubData(
		pubId,
		branchId,
		historyKey,
		pubMetadata.citationStyle,
	);
	const staticHtml = await createStaticHtml(
		{
			prosemirrorDoc: prosemirrorDoc,
			pubMetadata: pubMetadata,
			citations: citations,
			footnotes: footnotes,
			citationInlineStyle: pubMetadata.citationInlineStyle,
		},
		pandocTarget,
		pagedTarget,
	);
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
