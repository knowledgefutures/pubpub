import { SubmissionActivityItem } from 'types';
import { getDashUrl } from 'utils/dashboard';

import { TitleRenderer } from '../types';
import { getCollectionFromContext } from './util';

type AcceptedItem = SubmissionActivityItem;

const prefix = 'the Submission';

export const submissionTitle: TitleRenderer<AcceptedItem> = (item, context) => {
	const isInCollectionScope =
		'collectionId' in context.scope && context.scope.collectionId === item.collectionId;

	if (isInCollectionScope) {
		return {
			title: 'this Submission',
		};
	}

	const collectionFromContext = getCollectionFromContext(item.payload.submissionId, context);
	if (collectionFromContext) {
		return {
			prefix,
			title: collectionFromContext.title,
			href: getDashUrl({ collectionSlug: collectionFromContext.slug }),
		};
	}
	if ('submmission' in item.payload) {
		return {
			prefix,
			title: item.payload,
		};
	}
	return {
		prefix,
		title: 'an unknown Submission',
	};
};
