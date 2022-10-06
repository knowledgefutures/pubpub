import { IconName } from 'components';

export type PubPubIconName =
	| 'overview'
	| 'activity'
	| 'page'
	| 'layout'
	| 'review'
	| 'submission'
	| 'connection'
	| 'impact'
	| 'member'
	| 'settings'
	| 'collection'
	| 'pub'
	| 'community'
	| 'facets'
	| 'contributor';

export const pubPubIcons: Record<PubPubIconName, IconName> = {
	overview: 'home2',
	activity: 'pulse',
	page: 'page-layout',
	layout: 'page-layout',
	review: 'social-media',
	submission: 'manually-entered-data',
	connection: 'layout-auto',
	impact: 'dashboard',
	member: 'people',
	settings: 'cog',
	collection: 'collection',
	pub: 'pubDoc',
	community: 'office',
	facets: 'gem',
	contributor: 'user',
};
