import React from 'react';
import { Spinner } from '@blueprintjs/core';

import { PubByline } from 'components';
import { Menu, MenuItem, MenuItemDivider } from 'components/Menu';
import { usePageContext } from 'utils/hooks';
import { createReadingParamUrl, useCollectionPubs } from 'client/utils/collections';
import { pubUrl, collectionUrl } from 'utils/canonicalUrls';
import { getSchemaForKind } from 'utils/collections/schemas';
import { Collection, Pub } from 'utils/types';

import { usePubContext } from '../../pubHooks';
import CollectionsBarButton from './CollectionsBarButton';

require('./collectionBrowser.scss');

type Props = {
	collection: Collection;
	currentPub: Pub;
};

const CollectionBrowser = (props: Props) => {
	const { collection, currentPub } = props;
	const { updateLocalData } = usePubContext();
	const { communityData } = usePageContext();
	const { pubs, error, isLoading } = useCollectionPubs(updateLocalData, collection);
	const { bpDisplayIcon } = getSchemaForKind(collection.kind)!;
	const readingPubUrl = (pub) => createReadingParamUrl(pubUrl(communityData, pub), collection.id);

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
export default CollectionBrowser;
