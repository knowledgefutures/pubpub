import type { CommunityTemplate as CommunityTemplateModel } from 'server/communityTemplate/model';

import type { SerializedModel } from './serializedModel';

export type CommunityTemplate = SerializedModel<CommunityTemplateModel>;

/** Page blueprint within a template */
export type TemplatePageDefinition = {
	title: string;
	slug: string;
	description?: string | null;
	isPublic?: boolean;
	layout?: any[];
	isNarrowWidth?: boolean;
};

/** Collection blueprint within a template */
export type TemplateCollectionDefinition = {
	title: string;
	slug: string;
	kind: 'issue' | 'book' | 'conference' | 'tag';
	isPublic?: boolean;
	isRestricted?: boolean;
	layout?: any;
	metadata?: Record<string, any>;
};

/** Starter pub blueprint */
export type TemplateStarterPubDefinition = {
	title: string;
	slug?: string;
	/** Slug of a template collection to link this pub to */
	collectionSlug?: string;
	/** Initial ProseMirror document content */
	content?: any;
};

/** Default member to auto-add */
export type TemplateDefaultMember = {
	userId: string;
	permissions: 'view' | 'edit' | 'manage' | 'admin';
};

/** Partial community settings to merge on top of defaults */
export type TemplateCommunityOverrides = {
	heroTitle?: string | null;
	heroText?: string | null;
	heroLogo?: string | null;
	heroImage?: string | null;
	heroBackgroundImage?: string | null;
	heroBackgroundColor?: string | null;
	heroTextColor?: string | null;
	heroAlign?: string | null;
	heroPrimaryButton?: { title: string; url: string } | null;
	heroSecondaryButton?: { title: string; url: string } | null;
	hideHero?: boolean | null;
	hideHeaderLogo?: boolean | null;
	hideCreatePubButton?: boolean | null;
	headerColorType?: 'light' | 'dark' | 'custom' | null;
	headerLogo?: string | null;
	useHeaderTextAccent?: boolean | null;
	useHeaderGradient?: boolean | null;
	headerLinks?: Array<{ title: string; url: string; external?: boolean }> | null;
	footerTitle?: string | null;
	footerImage?: string | null;
	footerLogoLink?: string | null;
	accentColorLight?: string;
	accentColorDark?: string;
	avatar?: string | null;
	favicon?: string | null;
	hideNav?: boolean | null;
	socialLinksLocation?: 'header' | 'footer' | null;
	website?: string | null;
	twitter?: string | null;
	instagram?: string | null;
	mastodon?: string | null;
	linkedin?: string | null;
	bluesky?: string | null;
	github?: string | null;
	facebook?: string | null;
	email?: string | null;
};

/** Facet overrides keyed by facet name */
export type TemplateFacetOverrides = {
	CitationStyle?: Record<string, any>;
	License?: Record<string, any>;
	NodeLabels?: Record<string, any>;
	PubEdgeDisplay?: Record<string, any>;
	PubHeaderTheme?: Record<string, any>;
};

/** Navigation entry referencing pages/collections by slug (resolved to IDs at creation time) */
export type TemplateNavigationEntry =
	| { type: 'page' | 'collection'; slug: string }
	| { id: string; title: string; href: string }
	| {
			id: string;
			title: string;
			children: Array<
				| { type: 'page' | 'collection'; slug: string }
				| { id: string; title: string; href: string }
			>;
	  };

/** Shape for superadmin listing */
export type CommunityTemplateWithMeta = CommunityTemplate & {
	communityCount: number;
};
