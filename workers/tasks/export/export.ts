import type { Maybe } from 'types';

import { getPubDraftDoc } from 'server/utils/firebaseAdmin';
import { expect } from 'utils/assert';
import { getExportFormatDetails } from 'utils/export/formats';

import { renderStaticHtml } from './html';
import { getPubMetadata } from './metadata';
import { getNotesData } from './notes';
import { exportWithPaged } from './paged';
import { exportWithPandoc } from './pandoc';
import {
	assignFileToExportById,
	getExportById,
	getTmpFileForExtension,
	uploadDocument,
	writeToFile,
} from './util';

export const exportTask = async ({ exportId }: { exportId: string }) => {
	const { pubId, format, historyKey } = expect(await getExportById(exportId));
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
		const staticHtmlOptions = {
			pubDoc,
			notesData,
			pubMetadata,
			pagedTarget,
		};
		const staticHtml = await renderStaticHtml(staticHtmlOptions);
		if (pagedTarget) {
			url = (await exportWithPaged(staticHtml)).url;
		} else {
			await writeToFile(staticHtml, tmpFile);
		}
	}
	if (url === undefined) {
		url = await uploadDocument(pubId, tmpFile, extension);
	}
	await assignFileToExportById(exportId, url);

	const { hostname } = pubMetadata;

	return { url, hostname };
};
