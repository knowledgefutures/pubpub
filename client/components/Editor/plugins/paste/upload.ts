import { s3Upload } from 'client/utils/upload';
import { getResizedUrl } from 'utils/images';

import { MediaUploadHandler } from '../../types';

export const defaultMediaUploadHandler: MediaUploadHandler = (file: File) => {
	const id = Date.now().toString();
	if (file.type.startsWith('image/')) {
		return {
			id,
			start: (handlers) => {
				const { onProgress, onFinish } = handlers;
				s3Upload(
					file,
					({ loaded, total }) => onProgress(loaded / total),
					(_, __, ___, assetKey) => {
						const src = `https://assets.pubpub.org/${assetKey}`;
						const img = new Image();
						img.onload = () => onFinish(src);
						img.src = getResizedUrl(src, 'inside', 800);
					},
				);
			},
		};
	}
	return null;
};
