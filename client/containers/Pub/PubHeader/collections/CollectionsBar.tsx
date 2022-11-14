import React, { useState } from 'react';
import { OverflowList } from '@blueprintjs/core';

import { chooseCollectionForPub } from 'client/utils/collections';
import { collectionUrl } from 'utils/canonicalUrls';
import { getSchemaForKind } from 'utils/collections/schemas';
import { usePageContext } from 'utils/hooks';
import { Collection, CollectionPub as BareCollectionPub, Pub } from 'types';
import { PopoverButton, PubCollectionsListing } from 'components';
import { Menu, MenuItem } from 'components/Menu';

import CollectionBrowser from './CollectionBrowser';
import CollectionsBarButton from './CollectionsBarButton';

require('./collectionsBar.scss');

type CollectionPub = BareCollectionPub & { collection: Collection };

type Props = {
	pubData: Pub & { collectionPubs: CollectionPub[] };
	updatePubData: (patch: Partial<Pub>) => unknown;
};

const CollectionsBar = (props: Props) => {
	const { pubData, updatePubData } = props;
	const { collectionPubs } = pubData;
	const {
		communityData,
		locationData,
		scopeData: {
			activePermissions: { canManage },
		},
	} = usePageContext();
	const { collections: allCollectionsInCommunity } = communityData;
	const currentCollection = chooseCollectionForPub(pubData, locationData);
	const [showOnlyCollectionsQueryList, setShowOnlyCollectionsQueryList] = useState(
		collectionPubs.length === 0,
	);

	const collections = pubData.collectionPubs
		.filter(
			(cp: BareCollectionPub): cp is CollectionPub =>
				!!(cp.collection && cp.collection !== currentCollection),
		)
		.sort((a, b) => (a.pubRank > b.pubRank ? 1 : -1))
		.map((cp) => cp.collection);

	const handleCollectionsQueryListClose = () => {
		if (collectionPubs.length > 0) {
			setShowOnlyCollectionsQueryList(false);
		}
	};

	const renderOverflow = (overflowCollections: Collection[]) => {
		const containsAllCollections = overflowCollections.length === pubData.collectionPubs.length;
		const icon = containsAllCollections ? null : 'more';
		const rightIcon = containsAllCollections ? 'caret-down' : null;
		const label = containsAllCollections
			? overflowCollections.length === 1
				? 'collection'
				: 'collections'
			: 'more';
		return (
			<Menu
				placement="bottom-end"
				aria-label={overflowCollections.length + ' ' + label}
				disclosure={
					<CollectionsBarButton icon={icon} rightIcon={rightIcon}>
						{overflowCollections.length} {label}
					</CollectionsBarButton>
				}
			>
				{overflowCollections.map((collection) => {
					const schema = getSchemaForKind(collection.kind);
					return (
						<MenuItem
							icon={schema && schema.bpDisplayIcon}
							key={collection.id}
							text={collection.title}
							href={collectionUrl(communityData, collection)}
						/>
					);
				})}
			</Menu>
		);
	};

	const renderManageCollections = () => {
		const pubCollectionsListingProps = {
			pub: pubData,
			collectionPubs,
			canManage,
			updateCollectionPubs: (nextCollectionPubs) =>
				updatePubData({ collectionPubs: nextCollectionPubs }),
			allCollections: allCollectionsInCommunity,
			renderDragElementInPortal: true,
		};

		const button = (
			<CollectionsBarButton icon="plus" aria-label="Add or edit Pub Collections">
				{collectionPubs.length === 0 ? 'Add to Collection' : null}
			</CollectionsBarButton>
		);

		if (showOnlyCollectionsQueryList) {
			return (
				<PubCollectionsListing
					{...pubCollectionsListingProps}
					onQueryListClose={handleCollectionsQueryListClose}
					renderTriggerButtonForQueryList={() => button}
				/>
			);
		}
		return (
			<PopoverButton
				className="collections-bar-component_collections-popover"
				component={() => <PubCollectionsListing {...pubCollectionsListingProps} />}
				aria-label="Add or edit Pub Collections"
			>
				{button}
			</PopoverButton>
		);
	};

	const renderVisibleItem = (collection: Collection) => {
		return (
			<CollectionsBarButton
				key={collection.id}
				href={collectionUrl(communityData, collection)}
				as="a"
			>
				{collection.title}
			</CollectionsBarButton>
		);
	};

	if (collectionPubs.length === 0 && !canManage) {
		return null;
	}

	return (
		<div className="collections-bar-component">
			{currentCollection && (
				<CollectionBrowser collection={currentCollection} currentPub={pubData} />
			)}
			<OverflowList
				className="collections-list"
				collapseFrom="end"
				items={collections}
				visibleItemRenderer={renderVisibleItem}
				overflowRenderer={renderOverflow}
			/>
			{canManage && renderManageCollections()}
		</div>
	);
};
export default CollectionsBar;
