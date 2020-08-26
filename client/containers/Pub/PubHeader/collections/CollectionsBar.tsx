import React from 'react';
import { OverflowList } from '@blueprintjs/core';

// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'types/pub' or its correspondin... Remove this comment to see the full error message
import { pubDataProps } from 'types/pub';
import { chooseCollectionForPub } from 'client/utils/collections';
import { collectionUrl } from 'utils/canonicalUrls';
import { getSchemaForKind } from 'utils/collections/schemas';
import { usePageContext } from 'utils/hooks';
import { Menu, MenuItem } from 'components/Menu';

import CollectionBrowser from './CollectionBrowser';
import CollectionsBarButton from './CollectionsBarButton';

require('./collectionsBar.scss');

type Props = {
	pubData: pubDataProps;
	updateLocalData: (...args: any[]) => any;
};

const CollectionsBar = (props: Props) => {
	const { pubData, updateLocalData } = props;
	const { communityData, locationData } = usePageContext();
	const currentCollection = chooseCollectionForPub(pubData, locationData);

	if (pubData.collectionPubs.length === 0) {
		return null;
	}

	return (
		<div className="collections-bar-component">
			{currentCollection && (
				<CollectionBrowser
					collection={currentCollection}
					currentPub={pubData}
					updateLocalData={updateLocalData}
				/>
			)}
			<OverflowList
				className="collections-list"
				collapseFrom="end"
				items={pubData.collectionPubs
					.filter(
						(collectionPub) =>
							collectionPub.collection &&
							collectionPub.collection !== currentCollection,
					)
					.sort(
						(a, b) =>
							a.collection.title.toLowerCase() - b.collection.title.toLowerCase(),
					)}
				visibleItemRenderer={({ collection }) => (
					// @ts-expect-error ts-migrate(2322) FIXME: Property 'children' does not exist on type 'Intrin... Remove this comment to see the full error message
					<CollectionsBarButton
						key={collection.id}
						href={collectionUrl(communityData, collection)}
						as="a"
					>
						{collection.title}
					</CollectionsBarButton>
				)}
				overflowRenderer={(overflowCollections) => {
					const containsAllCollections =
						overflowCollections.length === pubData.collectionPubs.length;
					const icon = containsAllCollections ? null : 'more';
					const rightIcon = containsAllCollections ? 'caret-down' : null;
					const label = containsAllCollections
						? overflowCollections.length === 1
							? 'collection'
							: 'collections'
						: 'more';
					return (
						// @ts-expect-error ts-migrate(2322) FIXME: Property 'children' does not exist on type 'Intrin... Remove this comment to see the full error message
						<Menu
							placement="bottom-end"
							aria-label={overflowCollections.length + ' ' + label}
							disclosure={
								// @ts-expect-error ts-migrate(2322) FIXME: Property 'children' does not exist on type 'Intrin... Remove this comment to see the full error message
								<CollectionsBarButton icon={icon} rightIcon={rightIcon}>
									{overflowCollections.length} {label}
								</CollectionsBarButton>
							}
						>
							{/* @ts-expect-error ts-migrate(2345) FIXME: Type 'unknown' is not assignable to type '{ collec... Remove this comment to see the full error message */}
							{overflowCollections.map(({ collection }) => {
								const schema = getSchemaForKind(collection.kind);
								return (
									<MenuItem
										// @ts-expect-error ts-migrate(2322) FIXME: Property 'icon' does not exist on type 'IntrinsicA... Remove this comment to see the full error message
										icon={schema && schema.bpDisplayIcon}
										key={collection.id}
										text={collection.title}
										href={collectionUrl(communityData, collection)}
									/>
								);
							})}
						</Menu>
					);
				}}
			/>
		</div>
	);
};
export default CollectionsBar;
