import { PageActivityItem } from 'types';
import { getDashUrl } from 'utils/dashboard';

import { TitleRenderer } from '../types';

const prefix = 'the Page';

export const pageTitle: TitleRenderer<PageActivityItem> = (item, context) => {
	const pageFromContext = context.associations.page[item.payload.page.id];
	if (pageFromContext) {
		return {
			prefix,
			title: pageFromContext.title,
			href: getDashUrl({ mode: 'pages', subMode: pageFromContext.slug }),
		};
	}
	if ('page' in item.payload) {
		return {
			prefix,
			title: item.payload.page.title,
		};
	}
	return { title: 'an unknown Page' };
};
