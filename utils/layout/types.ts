import { DocJson } from 'types';

export const bannerButtonTypes = ['create-pub', 'signup', 'link'] as const;
type BannerButtonType = (typeof bannerButtonTypes)[number];
export const textAligns = ['left', 'center'] as const;
type TextAlign = (typeof textAligns)[number];

export const pubPreviewTypes = ['minimal', 'small', 'medium', 'large'] as const;
export type PubPreviewType = (typeof pubPreviewTypes)[number];

export const pubSortOrders = [
	'creation-date',
	'creation-date-reversed',
	'publish-date',
	'publish-date-reversed',
	'collection-rank',
] as const;
export type PubSortOrder = (typeof pubSortOrders)[number];

export const collectionsPagesJustifyTypes = [
	'center',
	'space-between',
	'space-around',
	'left',
] as const;
export type CollectionsPagesJustifyType = (typeof collectionsPagesJustifyTypes)[number];

export type LayoutPubsByBlock<PubType extends { id: string }> = {
	pubsById: Record<string, PubType>;
	pubIdsByBlockId: Record<string, string[]>;
};

export type LayoutOptions = {
	isNarrow?: boolean;
};

export type LayoutRenderContext = {
	collectionId?: string;
};

export type LayoutBlockPubs = {
	type: 'pubs';
	id: string;
	content: {
		collectionIds?: string[];
		hideByline?: boolean;
		hideContributors?: boolean;
		hideDates?: boolean;
		hideDescription?: boolean;
		hideEdges?: boolean;
		limit?: number;
		pubIds?: string[];
		pubPreviewType: PubPreviewType;
		sort?: PubSortOrder;
		title?: string;
	};
};

export type LayoutBlockText = {
	type: 'text';
	id: string;
	content: {
		text?: DocJson;
		align?: TextAlign;
	};
};

export type LayoutBlockHtml = {
	type: 'html';
	id: string;
	content: {
		html?: string;
	};
};

export type LayoutBlockBanner = {
	type: 'banner';
	id: string;
	content: {
		align?: TextAlign;
		backgroundColor?: string;
		backgroundHeight?: 'tall' | 'narrow';
		backgroundImage?: string;
		backgroundSize?: 'full' | 'standard';
		buttonText?: string;
		buttonType?: BannerButtonType;
		buttonUrl?: string;
		showButton?: boolean;
		text?: string;
	};
};

export type LayoutBlockCollectionsPages = {
	type: 'collections-pages';
	id: string;
	content: {
		items: { type: 'collection' | 'page'; id: string }[];
		title?: string;
		justify?: CollectionsPagesJustifyType;
	};
};

export type LayoutBlockCollectionHeader = {
	type: 'collection-header';
	id: string;
	content: {
		hideByline?: boolean;
		hideContributors?: boolean;
		hideDate?: boolean;
		hideCollectionKind?: boolean;
		hideDoi?: boolean;
		hiddenMetadataFields?: string[];
	};
};

export type LayoutBlockSubmissionBanner = {
	type: 'submission-banner';
	id: string;
	content: {
		title: string;
		body: DocJson;
		submissionWorkflowId: string;
	};
};

export type LayoutBlock =
	| LayoutBlockBanner
	| LayoutBlockCollectionsPages
	| LayoutBlockHtml
	| LayoutBlockPubs
	| LayoutBlockText
	| LayoutBlockCollectionHeader
	| LayoutBlockSubmissionBanner;

export type CollectionLayout = LayoutOptions & { blocks: LayoutBlock[] };
