import React from 'react';

import { CommunityCreatedActivityItem, CommunityUpdatedActivityItem } from 'types';

import { communityTitle } from '../titles';
import { itemRenderer } from './itemRenderer';

type Titles = 'community';

export const renderCommunityCreated = itemRenderer<CommunityCreatedActivityItem, Titles>({
	icon: 'office',
	titleRenderers: {
		community: communityTitle,
	},
	message: ({ titles }) => {
		const { actor, community } = titles;
		return (
			<>
				{actor} created {community}
			</>
		);
	},
});

export const renderCommunityUpdated = itemRenderer<CommunityUpdatedActivityItem, Titles>({
	icon: 'office',
	titleRenderers: {
		community: communityTitle,
	},
	message: ({ titles, item }) => {
		const { payload } = item;
		const { actor, community } = titles;
		if (payload.subdomain) {
			const { from, to } = payload.subdomain;
			return (
				<>
					{actor} changed the subdomain of {community} from {from} to {to}
				</>
			);
		}
		if (payload.title) {
			const { from, to } = payload.title;
			return (
				<>
					{actor} changed the title of {community} from <i>{from}</i> to <i>{to}</i>
				</>
			);
		}
		return (
			<>
				{actor} updated the settings for {community}
			</>
		);
	},
});
