import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Menu, MenuItem, OverflowList, Popover, Position, Tag } from '@blueprintjs/core';

import { pubDataProps } from 'types/pub';
import { chooseCollectionForPub } from 'utils/collections';
import { collectionUrl } from 'shared/utils/canonicalUrls';
import { PageContext } from 'components/PageWrapper/PageWrapper';

import CollectionBrowser from './CollectionBrowser';

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
					className="themed-button-component"
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
					<a
						key={collection.id}
						className="header-collection"
						href={collectionUrl(communityData, collection)}
					>
						<Tag>{collection.title}</Tag>
					</a>
				)}
				overflowRenderer={(collectionPubs) => (
					<Popover
						minimal
						modifiers={{
							preventOverflow: { enabled: false },
							hide: { enabled: false },
						}}
						position={Position.BOTTOM_RIGHT}
						className="header-collection"
						content={
							<Menu>
								{collectionPubs.map(({ collection }) => (
									<MenuItem
										key={collection.id}
										text={collection.title}
										href={collectionUrl(communityData, collection)}
									/>
								))}
							</Menu>
						}
					>
						<Tag icon="more" className="overflow-tag" interactive={true}>
							{collectionPubs.length} more
						</Tag>
					</Popover>
				)}
			/>
		</div>
	);
};

CollectionsBar.propTypes = propTypes;
export default CollectionsBar;
