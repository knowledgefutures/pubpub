import { PubEdgeCreatedActivityItem, PubEdgeRemovedActivityItem } from 'types';
import { pubShortUrl } from 'utils/canonicalUrls';
import { getDashUrl } from 'utils/dashboard';
import { relationTypeDefinitions } from 'utils/pubEdge';

import { TitleRenderer } from '../types';
import { getPubEdgeFromContext, getPubFromContext } from './util';

type AcceptedItem = PubEdgeCreatedActivityItem | PubEdgeRemovedActivityItem;

export const pubEdgeTargetTitle: TitleRenderer<AcceptedItem> = (item) => {
	const { target } = item.payload;
	if ('pub' in target) {
		const { pub } = target;
		return {
			title: pub.title,
			href: pubShortUrl(pub),
		};
	}
	const { externalPublication } = target;
	return {
		title: externalPublication.title,
		href: externalPublication.url,
	};
};

export const pubEdgeTitle: TitleRenderer<AcceptedItem> = (item, context) => {
	const pubEdgeFromContext = getPubEdgeFromContext(item.payload.pubEdgeId, context);
	const pubFromContext = getPubFromContext(item.pubId, context);
	if (pubEdgeFromContext && pubFromContext) {
		const { relationType } = pubEdgeFromContext;
		const relationTypeDefinition = relationTypeDefinitions[relationType];
		if (relationTypeDefinition) {
			const { article, name } = relationTypeDefinition;
			return {
				title: `${article} ${name.toLowerCase()} Connection`,
				href: getDashUrl({ pubSlug: pubFromContext.slug, mode: 'connections' }),
			};
		}
	}
	return {
		title: 'a Connection',
	};
};
