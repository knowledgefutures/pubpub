import { DocJson } from 'types';

type BannerButtonType = 'create-pub' | 'signup' | 'link';
type TextAlign = 'left' | 'center';

export type PubPreviewType = 'minimal' | 'small' | 'medium' | 'large';

export type PubSortOrder =
	| 'creation-date'
	| 'creation-date-reversed'
	| 'publish-date'
	| 'publish-date-reversed'
	| 'collection-rank';

export type CollectionsPagesJustifyType = 'center' | 'space-between' | 'space-around' | 'left';

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

export type LayoutBlock =
	| LayoutBlockBanner
	| LayoutBlockCollectionsPages
	| LayoutBlockHtml
	| LayoutBlockPubs
	| LayoutBlockText
	| LayoutBlockCollectionHeader;

export type CollectionLayout = LayoutOptions & { blocks: LayoutBlock[] };
