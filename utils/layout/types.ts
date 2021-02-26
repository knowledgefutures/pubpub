type BannerButtonType = 'create-pub' | 'signup' | 'link';
type TextAlign = 'left' | 'center';

export type PubPreviewType = 'minimal' | 'small' | 'medium' | 'large';

export type PubSortOrder =
	| 'legacy'
	| 'creation-date'
	| 'creation-date-reversed'
	| 'publish-date'
	| 'publish-date-reversed'
	| 'collection-rank';

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
		text?: string;
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
	};
};

export type LayoutBlockCollectionHeader = {
	type: 'collection-header';
	id: string;
	content: {
		hideByline?: boolean;
		hideContributors?: boolean;
		hideDate?: boolean;
		hideDoi?: boolean;
		hideCollectionKind?: boolean;
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
