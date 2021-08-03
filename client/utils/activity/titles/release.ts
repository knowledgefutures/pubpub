import { PubReleasedActivityItem } from 'types';
import { pubUrl } from 'utils/canonicalUrls';

import { TitleRenderer } from '../types';
import { getPubFromContext } from './util';

export const releaseTitle: TitleRenderer<PubReleasedActivityItem> = (item, context) => {
	const pubFromContext = getPubFromContext(item.pubId, context);

	const href = pubFromContext
		? pubUrl(null, pubFromContext, { releaseId: item.payload.releaseId })
		: null;

	return { title: 'a Release', href };
};
