import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { OverflowList } from '@blueprintjs/core';

import { pubDataProps } from 'types/pub';
import { chooseCollectionForPub } from 'utils/collections';
import { collectionUrl } from 'shared/utils/canonicalUrls';
import { PageContext } from 'components/PageWrapper/PageWrapper';
import { Menu, MenuItem } from 'components/Menu';

import CollectionBrowser from './CollectionBrowser';
import CollectionsBarButton from './CollectionsBarButton';

require('./collectionsBar.scss');

const propTypes = {
	pubData: pubDataProps.isRequired,
	updateLocalData: PropTypes.func.isRequired,
};

const CollectionsBar = (props) => {
	const { pubData, updateLocalData } = props;
	const { communityData, locationData } = useContext(PageContext);
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
					<CollectionsBarButton
						key={collection.id}
						href={collectionUrl(communityData, collection)}
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
						<Menu
							aria-label={overflowCollections.length + ' ' + label}
							disclosure={
								<CollectionsBarButton icon={icon} rightIcon={rightIcon}>
									{overflowCollections.length} {label}
								</CollectionsBarButton>
							}
						>
							{overflowCollections.map(({ collection }) => (
								<MenuItem
									key={collection.id}
									text={collection.title}
									href={collectionUrl(communityData, collection)}
								/>
							))}
						</Menu>
					);
				}}
			/>
		</div>
	);
};

CollectionsBar.propTypes = propTypes;
export default CollectionsBar;
