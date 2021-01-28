import { DecorationSet } from 'prosemirror-view';

export type UploadStartMeta = { type: 'uploadStart'; id: string; position: number };
export type UploadFinishMeta = { type: 'uploadFinish'; id: string; src: string };
export type UploadProgressMeta = { type: 'uploadProgress'; id: string; progress: number };
export type UploadFailureMeta = { type: 'uploadFailure'; id: string };

export type Meta = UploadStartMeta | UploadFinishMeta | UploadFailureMeta | UploadProgressMeta;

export type PluginState = {
	decorations: DecorationSet;
};
