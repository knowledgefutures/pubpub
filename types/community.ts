import type { Community as CommunityModel } from 'server/models';

import type { SerializedModel } from './serializedModel';

export type CommunityHeroButton = {
	title: string;
	url: string;
};

export type CommunityHeaderLink = {
	title: string;
	url: string;
	external?: boolean;
};

export type Community = SerializedModel<CommunityModel>;

export const discussionCreationAccessValues = [
	'public',
	'contributors-members',
	'disabled',
] as const;
export type DiscussionCreationAccess = (typeof discussionCreationAccessValues)[number];
