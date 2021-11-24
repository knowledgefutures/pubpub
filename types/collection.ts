import { CollectionLayout } from 'utils/layout/types';

import { CollectionAttribution } from './attribution';
import { Pub } from './pub';
import { ScopeSummary } from './scope';

export type Collection = {
	id: string;
	title: string;
	slug: string;
	avatar?: string;
	isRestricted: boolean;
	isPublic: boolean;
	viewHash?: string;
	editHash?: string;
	metadata?: { [k: string]: any };
	kind: 'tag' | 'issue' | 'book' | 'conference';
	doi?: string;
	readNextPreviewSize: 'none' | 'minimal' | 'medium' | 'choose-best';
	pageId?: null | string;
	communityId: string;
	attributions?: CollectionAttribution[];
	layout: CollectionLayout;
	createdAt: string;
	scopeSummaryId: null | string;
	scopeSummary?: ScopeSummary;
};

export type CollectionPub = {
	id: string;
	pubId: string;
	collectionId: string;
	contextHint?: null | string;
	rank: string;
	pubRank: string;
	collection?: Collection;
	pub?: Pub;
};
