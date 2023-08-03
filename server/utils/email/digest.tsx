import { minify } from 'html-minifier';
import juice from 'juice';
import flow from 'lodash.flow';
import omit from 'lodash.omit';
import pick from 'lodash.pick';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { ServerStyleSheet, StyleSheetManager } from 'styled-components';

import { ActivityAssociations, ActivityItem, Community, ScopeId, User } from 'types';
import { Digest } from 'components/Email';
import { globals, reset } from 'components/Email/styles';
import { fetchActivityItems } from 'server/activityItem/fetch';
import { collectionUrl, pubUrl } from 'utils/canonicalUrls';

type KeyedActivityItem = ActivityItem & {
	displayKey: string;
};

const getAffectedObject = (item: ActivityItem, associations: ActivityAssociations) => {
	// Check the payload rather than the associations for items that might have since been deleted
	if ('pub' in item.payload) {
		const { title } = item.payload.pub;
		return {
			id: item.pubId!,
			title,
		};
	}
	if ('collection' in item.payload) {
		const { title } = item.payload.collection;
		return {
			id: item.collectionId!,
			title,
		};
	}
	if ('page' in item.payload) {
		const { id, title } = item.payload.page;
		return { id, title };
	}
	// We can be reasonably sure that this Community still exists since we're sending its digest
	const { title } = associations.community[item.communityId];
	return {
		id: item.communityId,
		title,
	};
};

const getAffectedObjectUrl = (item: ActivityItem, associations: ActivityAssociations) => {
	const { pubId, collectionId } = item;
	const community = Object.values(associations.community)[0];
	const pub = pubId && associations.pub[pubId];
	const collection = collectionId && associations.collection[collectionId];
	if (pub) {
		return pubUrl(community, pub);
	}
	if (collection) {
		return collectionUrl(community, collection);
	}
	return null;
};

const getAffectedObjectIcon = (item: ActivityItem) =>
	item.pubId
		? 'pubDoc'
		: item.collectionId
		? 'collection'
		: 'page' in item.payload && item.payload.page.id
		? 'page-layout'
		: 'office';

const groupByObjectId =
	(associations: ActivityAssociations) =>
	(items: ActivityItem[]): Record<string, KeyedActivityItem[]> =>
		items.reduce((result, item) => {
			const objectId = getAffectedObject(item, associations).id;
			const payloadKeys = Object.keys(item.payload).sort().join('_');
			const displayKey = `${item.kind} - ${payloadKeys}`;
			return {
				...result,
				[objectId]: [...(result[objectId] || []), { ...item, displayKey }],
			};
		}, {});

const dedupActivityItems =
	(associations: ActivityAssociations) =>
	(itemsGroupedByObjectId: Record<string, KeyedActivityItem[]>) =>
		Object.entries(itemsGroupedByObjectId).reduce(
			(memo, [objectId, items]) => ({
				...memo,
				[objectId]: {
					items: items
						.sort((first, second) => (first.timestamp > second.timestamp ? -1 : 1))
						.reduce(
							(result, item) =>
								item.displayKey in result
									? result
									: { ...result, [item.displayKey]: item },
							{},
						),
					title: getAffectedObject(items[0], associations)?.title,
					icon: getAffectedObjectIcon(items[0]),
					url: getAffectedObjectUrl(items[0], associations),
				},
			}),
			{},
		);

type GetDigestOptions = {
	user: User;
	scope: ScopeId;
};

export const getDigestData = async (options: GetDigestOptions) => {
	const { user, scope } = options;
	const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
	const { activityItems, associations } = await fetchActivityItems({ scope, since });
	const dedupedActivityItems = flow([
		groupByObjectId(associations),
		dedupActivityItems(associations),
	])(activityItems);
	return {
		userId: user.id, // replace this with email recipient's userId
		associations,
		pubItems: omit(dedupedActivityItems, scope.communityId),
		communityItems: pick(dedupedActivityItems, scope.communityId),
	};
};

const inlineStylesWithMarkup = (emailMarkup: React.ReactNode, extraStyles: string) => {
	const stylesheet = new ServerStyleSheet();
	const renderedStringFromEmailMarkup = ReactDOMServer.renderToString(
		<StyleSheetManager sheet={stylesheet.instance}>{emailMarkup}</StyleSheetManager>,
	);
	const basicStyles = stylesheet.getStyleTags();
	const fullSize = juice(
		`<head><meta charset="utf-8"/>${basicStyles}</head>${renderedStringFromEmailMarkup}`,
		{
			extraCss: `${reset} ${globals} ${extraStyles}`,
		},
	);
	return minify(fullSize, {
		collapseWhitespace: true,
		maxLineLength: 700,
		collapseBooleanAttributes: true,
		minifyCSS: true,
		processConditionalComments: true,
		removeAttributeQuotes: true,
		removeComments: true,
		removeEmptyAttributes: true,
		removeOptionalTags: true,
		removeRedundantAttributes: true,
		removeTagWhitespace: true,
		useShortDoctype: true,
	});
};

const render = (emailMarkup: React.ReactNode, extraStyles = '') => {
	return `<!DOCTYPE html><html lang="en">${inlineStylesWithMarkup(
		emailMarkup,
		extraStyles,
	)}</html>`;
};

export const renderDigestEmail = async (community: Community, options: GetDigestOptions) => {
	const digestData = await getDigestData(options);
	if (
		Object.keys(digestData.communityItems).length === 0 &&
		Object.keys(digestData.pubItems).length === 0
	) {
		return null;
	}
	return render(
		Digest({
			community,
			...digestData,
		}),
	);
};
