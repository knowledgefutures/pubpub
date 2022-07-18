import { EditorView } from 'prosemirror-view';

import { MediaUploadHandler, MediaUploadInstance } from '../../types';

import { pastePluginKey } from './key';
import { UploadStartMeta, UploadFinishMeta, UploadFailureMeta, UploadProgressMeta } from './types';
import { dataUriToFile } from './util';

const dispatchUploadStart = (view: EditorView, id: string, position: number) => {
	const { tr } = view.state;
	const meta: UploadStartMeta = { type: 'uploadStart', id, position };
	tr.setMeta(pastePluginKey, meta);
	view.dispatch(tr);
};

const dispatchUploadFailure = (view: EditorView, id: string) => {
	const { tr } = view.state;
	const meta: UploadFailureMeta = { type: 'uploadFailure', id };
	tr.setMeta(pastePluginKey, meta);
	view.dispatch(tr);
};

const dispatchUploadFinish = (view: EditorView, id: string, src: string) => {
	const { tr } = view.state;
	const meta: UploadFinishMeta = { type: 'uploadFinish', id, src };
	tr.setMeta(pastePluginKey, meta);
	view.dispatch(tr);
};

const dispatchUploadProgress = (view: EditorView, id: string, progress: number) => {
	const { tr } = view.state;
	const meta: UploadProgressMeta = { type: 'uploadProgress', id, progress };
	tr.setMeta(pastePluginKey, meta);
	view.dispatch(tr);
};

const startUpload = (upload: MediaUploadInstance, position: number, view: EditorView) => {
	const { id, start } = upload;
	dispatchUploadStart(view, id, position);
	start({
		onFailure: () => dispatchUploadFailure(view, id),
		onFinish: (src) => dispatchUploadFinish(view, id, src),
		onProgress: (progress) => dispatchUploadProgress(view, id, progress),
	});
};

const getMediaUploadFromClipboard = (
	uploadFn: MediaUploadHandler,
	clipboardItems: null | DataTransferItemList,
) => {
	if (clipboardItems) {
		const clipboardItemsArray = Array.from(clipboardItems);
		for (let i = 0; i < clipboardItemsArray.length; i++) {
			const clipboardItem = clipboardItemsArray[i];
			const file = clipboardItem.getAsFile();
			if (file) {
				const maybeUpload = uploadFn(file);
				if (maybeUpload) {
					return maybeUpload;
				}
			}
		}
	}
	return null;
};

const appearsToBePastingFromMsOffice = (event: ClipboardEvent) => {
	const html = event.clipboardData?.getData('text/html');
	return html && html.includes(`xmlns:o="urn:schemas-microsoft-com:office:office`);
};

type MaybeClipboardEvent = Event & {
	clipboardData?: any;
};

export const createPasteHandler =
	(uploadFn: MediaUploadHandler) => (view: EditorView, event: MaybeClipboardEvent) => {
		const { clipboardData } = event;
		if (!clipboardData) return false;
		if (appearsToBePastingFromMsOffice(event as ClipboardEvent)) {
			return false;
		}
		const selection = view.state.selection;
		const clipboardItems = event.clipboardData?.items;
		const upload = getMediaUploadFromClipboard(uploadFn, clipboardItems || null);
		if (upload) {
			startUpload(upload, selection.to, view);
			event.preventDefault();
			return true;
		}
		return false;
	};

const getImageSrcFromPastedHtml = (textData: string | null) => {
	if (textData) {
		const container = document.createElement('div');
		container.innerHTML = textData;
		const firstChild = container.children[0];
		if (firstChild && firstChild instanceof HTMLImageElement && !firstChild.dataset.pmSlice) {
			return firstChild.src;
		}
	}
	return null;
};

type MaybeDragEvent = Event & {
	dataTransfer?: any;
	clientY?: any;
	clientX?: any;
};

// Thanks to https://gitlab.com/emergence-engineering/prosemirror-image-plugin/-/blob/master/src/plugin/dropHandler.ts
// from which some of the hairier details of this function were cribbed.
export const createDropHandler =
	(uploadFn: MediaUploadHandler) => (view: EditorView, event: MaybeDragEvent) => {
		if (!event.dataTransfer || !event.clientY || !event.clientX) return false;
		const textData = event.dataTransfer?.getData('text/html');
		const evtFile = event.dataTransfer?.files?.[0];
		const imageSrc = getImageSrcFromPastedHtml(textData || null);
		const positionData = view.posAtCoords({
			top: event.clientY,
			left: event.clientX,
		});
		if (positionData) {
			const file = evtFile || (imageSrc && dataUriToFile(imageSrc));
			const upload = file && uploadFn(file);
			if (upload) {
				startUpload(upload, positionData.pos, view);
				event.preventDefault();
				event.stopPropagation();
				return true;
			}
		}
		return false;
	};
