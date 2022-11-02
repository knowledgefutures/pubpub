import React from 'react';

import {
	ActivityAssociations,
	ActivityItemKind,
	InsertableActivityItem,
	ScopeId,
	User,
} from 'types';
import { IconName } from 'components';

// Information we'll pass around about the current render
export type ActivityRenderContext = {
	associations: ActivityAssociations;
	scope: ScopeId;
	userId: null | string;
	otherActorsCount?: number;
};

// The title of an object to be included in a Message. For a given object, such as a Pub, this may
// change based on the current ActivityItemsRenderContext; for instance, it may be "this Pub" or
// the actual title of the Pub. Likewise the Title rendered for a User may be that user's name
// or simply "you".
export type Title = {
	title: React.ReactNode;
	href?: string | null;
	prefix?: string | null;
	suffix?: string | null;
};

// Renders a title of some object included in the ItemType. A specific instance of a TitleRenderer
// might be TitleRenderer<CommunityCreatedActivityItem> which would render a title for a Community.
// The identifier for the rendered title is bound by the caller. An ItemType (which is probably a
// union of specific activity types) needs to be provided when instantiating a TitleRenderer so we
// know what properties we can extract from the item, and which MessageRenderers may use it.
export type TitleRenderer<ItemType extends InsertableActivityItem> = (
	item: ItemType,
	context: ActivityRenderContext,
) => Title;

// A RenderedActivityItem is an almost fully-baked representation of how this item will be
// displayed to users.
export type RenderedActivityItem = {
	// The ID of the underlying ActivityItem.
	id: string;
	// An icon to display with this item.
	icon: IconName;
	// The main thing we have to say about this item
	// For instance: "Travis Rich created the Pub 'New Pub on October 11'""
	message: React.ReactNode;
	// An excerpt from the item that may be helpful to see, for instance the beginning of a
	// comment in a Thread.
	excerpt: React.ReactNode;
	// The time associated with this item.
	timestamp: Date;
	// The Scope associated with this item, which can be used for filtering.
	scope: ScopeId;
	// The user who performed the action
	actor: null | User;
};

// The lone argument to renderItem(). We need to tell it what items it can expect to be
// able to render (this will typically be a specific type like CommunityCreatedActivityItem), and
// also what models (e.g. a Pub or a Collection) we'll be titling during this render.
export type ActivityItemRenderOptions<
	Item extends InsertableActivityItem,
	Titles extends string,
> = {
	icon: IconName | ((options: { context: ActivityRenderContext }) => IconName);
	titleRenderers: Record<Titles, TitleRenderer<Item>>;
	message: (options: {
		item: Item;
		titles: Record<Titles | 'actor', React.ReactNode>;
		context: ActivityRenderContext;
	}) => React.ReactNode;
	excerpt?: (options: { item: Item; context: ActivityRenderContext }) => React.ReactNode;
};

// The return type of renderItem() is a partially applied function
export type ActivityItemRenderer<Item extends InsertableActivityItem> = (
	item: Item,
	context: ActivityRenderContext,
) => RenderedActivityItem;

// A manifest of renderers for all activity item types (to make sure they're accounted for)
type RenderableActivityItemKind = Exclude<
	ActivityItemKind,
	'submission-created' | 'submission-deleted'
>;
export type ActivityItemRenderers = {
	[K in RenderableActivityItemKind]: ActivityItemRenderer<InsertableActivityItem & { kind: K }>;
};
