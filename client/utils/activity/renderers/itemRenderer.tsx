import React from 'react';

import { ActivityItem, InsertableActivityItem } from 'types';

import { actorTitle } from '../titles';
import {
	ActivityItemRenderOptions,
	ActivityItemRenderer,
	Title,
	TitleRenderer,
	ActivityRenderContext,
} from '../types';

const renderTitleToReact = (title: Title) => {
	const { title: titleString, href, prefix } = title;
	const inner = href ? (
		<a href={href} target="_blank" rel="noreferrer">
			{titleString}
		</a>
	) : (
		titleString
	);
	return (
		<>
			{prefix ? `${prefix} ` : null}
			<b>{inner}</b>
		</>
	);
};

const renderTitles = <Item extends InsertableActivityItem, Titles extends string>(
	item: Item,
	titleRenderers: Record<Titles, TitleRenderer<Item>>,
	context: ActivityRenderContext,
): Record<Titles | 'actor', React.ReactNode> => {
	const renderedTitles = {
		actor: actorTitle(item, context),
	};
	Object.keys(titleRenderers).forEach((key) => {
		const renderer = titleRenderers[key as Titles];
		const title = renderer(item, context);
		renderedTitles[key] = renderTitleToReact(title);
	});
	return renderedTitles as Record<Titles | 'actor', React.ReactNode>;
};

export const itemRenderer = <Item extends InsertableActivityItem, Titles extends string>(
	options: ActivityItemRenderOptions<Item, Titles>,
): ActivityItemRenderer<Item> => {
	const { icon, titleRenderers, message, excerpt } = options;
	return (item: Item, context: ActivityRenderContext) => {
		const { communityId, collectionId, pubId } = item;
		const titles = renderTitles(item, titleRenderers, context);
		return {
			icon,
			context,
			timestamp: new Date(((item as unknown) as ActivityItem).timestamp).valueOf(),
			message: message({ item, titles, context }),
			excerpt: excerpt?.({ item, context }),
			scope: {
				communityId,
				collectionId,
				pubId,
			},
		};
	};
};
