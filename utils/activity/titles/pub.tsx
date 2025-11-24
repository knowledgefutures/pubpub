import type { TitleRenderer } from 'client/utils/activity/types';
import type {
	CollectionPubCreatedActivityItem,
	CollectionPubRemovedActivityItem,
	FacetsActivityItem,
	MemberActivityItem,
	PubActivityItem,
	SubmissionActivityItem,
} from 'types';

import React from 'react';

import { PubTitle } from 'components';
import { getDashUrl } from 'utils/dashboard';

import { getPubFromContext } from './util';

type AcceptedItem =
	| (MemberActivityItem & { pubId: string })
	| (FacetsActivityItem & { pubId: string })
	| PubActivityItem
	| CollectionPubCreatedActivityItem
	| CollectionPubRemovedActivityItem
	| SubmissionActivityItem;

const prefix = 'the Pub';

export const pubTitle: TitleRenderer<AcceptedItem> = (item, context) => {
	const isInPubScope = 'pubId' in context.scope && item.pubId === context.scope.pubId;
	if (isInPubScope) {
		return {
			title: 'this Pub',
		};
	}
	const pubFromContext = getPubFromContext(item.pubId, context);
	if (pubFromContext) {
		return {
			prefix,
			title: <PubTitle pubData={pubFromContext} />,
			href: getDashUrl({ pubSlug: pubFromContext.slug }),
		};
	}
	if ('pub' in item.payload) {
		return {
			prefix,
			title: item.payload.pub.title,
		};
	}
	return { title: 'an unknown Pub' };
};
