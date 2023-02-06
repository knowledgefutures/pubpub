import React from 'react';

import {
	PubActivityItem,
	CollectionPubCreatedActivityItem,
	CollectionPubRemovedActivityItem,
	MemberActivityItem,
	SubmissionActivityItem,
	FacetsActivityItem,
} from 'types';
import { PubTitle } from 'components';
import { getDashUrl } from 'utils/dashboard';

import { TitleRenderer } from '../types';
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
