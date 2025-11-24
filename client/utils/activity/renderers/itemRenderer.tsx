import type { ActivityItem, InsertableActivityItem } from 'types';

import type {
	ActivityItemRenderer,
	ActivityItemRenderOptions,
	ActivityRenderContext,
	Title,
	TitleRenderer,
} from '../types';

import React from 'react';

import { actorTitle } from 'utils/activity/titles';
import { communityUrl } from 'utils/canonicalUrls';
import { isExternalUrl } from 'utils/urls';

const renderTitleToReact = (title: Title, context: ActivityRenderContext) => {
	const { title: titleNode, href, prefix, suffix } = title;
	const community = Object.values(context.associations.community)[0];
	const communityHref =
		href &&
		(!href.startsWith('http') && community
			? `${communityUrl(Object.values(context.associations.community)[0])}/${href.replace(
					/^\//,
					'',
				)}`
			: href);

	const inner = communityHref ? (
		<a
			href={communityHref}
			target={isExternalUrl(href) ? '_blank' : undefined}
			rel="noreferrer"
		>
			{titleNode}
		</a>
	) : (
		titleNode
	);
	return (
		<>
			{prefix ? `${prefix} ` : null}
			<strong>{inner}</strong>
			{suffix ? ` ${suffix}` : null}
		</>
	);
};

const renderTitles = <Item extends InsertableActivityItem, Titles extends string>(
	item: Item,
	titleRenderers: Record<Titles, TitleRenderer<Item>>,
	context: ActivityRenderContext,
): Record<Titles | 'actor', React.ReactNode> => {
	const renderedTitles = {
		actor: renderTitleToReact(actorTitle(item, context), context),
	};
	Object.keys(titleRenderers).forEach((key) => {
		const renderer = titleRenderers[key as Titles];
		const title = renderer(item, context);
		renderedTitles[key] = renderTitleToReact(title, context);
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
		const { id, timestamp } = item as unknown as ActivityItem;
		return {
			id,
			icon: typeof icon === 'function' ? icon({ context }) : icon,
			actor: item.actorId ? context.associations.user[item.actorId] : null,
			context,
			timestamp: new Date(timestamp),
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
