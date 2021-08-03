import React from 'react';

import {
	CollectionCreatedActivityItem,
	CollectionUpdatedActivityItem,
	CollectionRemovedActivityItem,
	CollectionPubCreatedActivityItem,
	CollectionPubRemovedActivityItem,
} from 'types';

import { collectionTitle, pubTitle } from '../titles';
import { itemRenderer } from './itemRenderer';

type BaseTitles = 'collection';
type CollectionPubTitles = BaseTitles | 'pub';

export const renderCollectionCreated = itemRenderer<CollectionCreatedActivityItem, BaseTitles>({
	icon: 'collection',
	titleRenderers: {
		collection: collectionTitle,
	},
	message: ({ titles }) => {
		const { actor, collection } = titles;
		return (
			<>
				{actor} created {collection}
			</>
		);
	},
});

export const renderCollectionUpdated = itemRenderer<CollectionUpdatedActivityItem, BaseTitles>({
	icon: 'collection',
	titleRenderers: {
		collection: collectionTitle,
	},
	message: ({ titles, item }) => {
		const { payload } = item;
		const { actor, collection } = titles;
		if (payload.title) {
			return (
				<>
					{actor} changed the title of {collection} from {payload.title.from} to{' '}
					{payload.title.to}
				</>
			);
		}
		if (payload.slug) {
			return (
				<>
					{actor} changed the title of {collection} from {payload.slug.from} to{' '}
					{payload.slug.to}
				</>
			);
		}
		if (payload.layout) {
			return (
				<>
					{actor} updated the layout of {collection}
				</>
			);
		}
		if (payload.doi) {
			return (
				<>
					{actor} set the DOI of {collection} to {payload.doi.to}
				</>
			);
		}
		if (payload.metadata) {
			return (
				<>
					{actor} updated the metadata for {collection}
				</>
			);
		}
		if (payload.isRestricted) {
			const isNowRestricted = payload.isRestricted.to;
			if (isNowRestricted) {
				return (
					<>
						{actor} made {collection} restricted
					</>
				);
			}
			return (
				<>
					{actor} made {collection} open
				</>
			);
		}
		if (payload.isPublic) {
			const isNowPublic = payload.isPublic.to;
			if (isNowPublic) {
				return (
					<>
						{actor} made {collection} public
					</>
				);
			}
			return (
				<>
					{actor} made {collection} private
				</>
			);
		}
		return (
			<>
				{actor} updated the settings for {collection}
			</>
		);
	},
});

export const renderCollectionRemoved = itemRenderer<CollectionRemovedActivityItem, BaseTitles>({
	icon: 'collection',
	titleRenderers: {
		collection: collectionTitle,
	},
	message: ({ titles }) => {
		const { actor, collection } = titles;
		return (
			<>
				{actor} removed {collection}
			</>
		);
	},
});

export const renderCollectionPubCreated = itemRenderer<
	CollectionPubCreatedActivityItem,
	CollectionPubTitles
>({
	icon: ({ context }) => ('collectionId' in context.scope ? 'pubDoc' : 'collection'),
	titleRenderers: {
		collection: collectionTitle,
		pub: pubTitle,
	},
	message: ({ titles }) => {
		const { actor, pub, collection } = titles;
		return (
			<>
				{actor} added {pub} to {collection}
			</>
		);
	},
});

export const renderCollectionPubRemoved = itemRenderer<
	CollectionPubRemovedActivityItem,
	CollectionPubTitles
>({
	icon: ({ context }) => ('collectionId' in context.scope ? 'pubDoc' : 'collection'),
	titleRenderers: {
		collection: collectionTitle,
		pub: pubTitle,
	},
	message: ({ titles }) => {
		const { actor, pub, collection } = titles;
		return (
			<>
				{actor} removed {pub} from {collection}
			</>
		);
	},
});
