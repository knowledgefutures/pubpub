import React from 'react';

import { SubmissionUpdatedActivityItem } from 'types';

import { pubTitle, collectionTitle } from '../titles';
import { itemRenderer } from './itemRenderer';

type Titles = 'pub' | 'collection';

export const renderSubmissionUpdated = itemRenderer<SubmissionUpdatedActivityItem, Titles>({
	icon: 'manually-entered-data',
	titleRenderers: {
		pub: pubTitle,
		collection: collectionTitle,
	},
	message: ({ titles, item }) => {
		const { payload } = item;
		const { actor, pub, collection } = titles;
		const { from, to } = payload.status;
		if (to === 'received') {
			return (
				<>
					{actor} submitted {pub} into {collection}
				</>
			);
		}
		return (
			<>
				{actor} updated the submission status for {pub} in {collection} from <i>{from}</i>{' '}
				to <i>{to}</i>
			</>
		);
	},
});
