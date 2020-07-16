import React from 'react';
import PropTypes from 'prop-types';
import { Spinner } from '@blueprintjs/core';

import { PubByline } from 'components';
import { Menu, MenuItem, MenuItemDivider } from 'components/Menu';
import { pubDataProps } from 'types/pub';
import { usePageContext } from 'utils/hooks';
import { createReadingParamUrl, useCollectionPubs } from 'client/utils/collections';
import { pubUrl, collectionUrl } from 'utils/canonicalUrls';
import { getSchemaForKind } from 'utils/collections/schemas';

import CollectionsBarButton from './CollectionsBarButton';

require('./collectionBrowser.scss');

const propTypes = {
	collection: PropTypes.shape({
		id: PropTypes.string,
		kind: PropTypes.string,
		title: PropTypes.string,
		pageId: PropTypes.string,
	}).isRequired,
	currentPub: pubDataProps.isRequired,
	updateLocalData: PropTypes.func.isRequired,
};

const CollectionBrowser = (props) => {
	const { collection, currentPub, updateLocalData } = props;
	const { communityData } = usePageContext();
	const { pubs, error, isLoading } = useCollectionPubs(updateLocalData, collection);
	const { bpDisplayIcon } = getSchemaForKind(collection.kind);
	const readingPubUrl = (pub) => createReadingParamUrl(pubUrl(communityData, pub), collection);

	// eslint-disable-next-line react/prop-types
	const renderDisclosure = ({ ref, ...disclosureProps }) => {
		return (
			<CollectionsBarButton
				icon={bpDisplayIcon}
				className="collection-browser-button"
				rightIcon="caret-down"
				ref={ref}
				{...disclosureProps}
			>
				{collection.title}
			</CollectionsBarButton>
		);
	};

	return (
		<Menu
			className="collection-browser-component_menu"
			disclosure={renderDisclosure}
			aria-label="Browse this collection"
		>
			{collection.pageId && (
				<>
					<MenuItem
						icon="collection"
						text={collection.title}
						href={collectionUrl(communityData, collection)}
					/>
					<MenuItemDivider />
				</>
			)}
			{isLoading && (
				<MenuItem
					disabled
					className="loading-menu-item"
					textClassName="menu-item-text"
					icon={<Spinner size={30} />}
					text="Loading..."
				/>
			)}
			{pubs &&
				!isLoading &&
				pubs.map((pub) => (
					<MenuItem
						active={currentPub.id === pub.id}
						href={readingPubUrl(pub)}
						textClassName="menu-item-text"
						icon="pubDoc"
						key={pub.id}
						text={
							<>
								<div className="title">{pub.title}</div>
								<PubByline pubData={pub} linkToUsers={false} />
							</>
						}
					/>
				))}
			{error && (
				<MenuItem
					disabled
					className="loading-menu-item"
					textClassName="menu-item-text"
					text="Error loading Pubs"
				/>
			)}
		</Menu>
	);
};

CollectionBrowser.propTypes = propTypes;
export default CollectionBrowser;
