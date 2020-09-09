import React from 'react';
import { Spinner } from '@blueprintjs/core';

import { PubByline } from 'components';
import { Menu, MenuItem, MenuItemDivider } from 'components/Menu';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'types/pub' or its correspondin... Remove this comment to see the full error message
import { pubDataProps } from 'types/pub';
import { usePageContext } from 'utils/hooks';
import { createReadingParamUrl, useCollectionPubs } from 'client/utils/collections';
import { pubUrl, collectionUrl } from 'utils/canonicalUrls';
import { getSchemaForKind } from 'utils/collections/schemas';

import CollectionsBarButton from './CollectionsBarButton';

require('./collectionBrowser.scss');

type Props = {
	collection: {
		id?: string;
		kind?: string;
		title?: string;
		pageId?: string;
	};
	currentPub: pubDataProps;
	updateLocalData: (...args: any[]) => any;
};

const CollectionBrowser = (props: Props) => {
	const { collection, currentPub, updateLocalData } = props;
	const { communityData } = usePageContext();
	const { pubs, error, isLoading } = useCollectionPubs(updateLocalData, collection);
	// @ts-expect-error ts-migrate(2339) FIXME: Property 'bpDisplayIcon' does not exist on type '{... Remove this comment to see the full error message
	const { bpDisplayIcon } = getSchemaForKind(collection.kind);
	const readingPubUrl = (pub) => createReadingParamUrl(pubUrl(communityData, pub), collection);

	// eslint-disable-next-line react/prop-types
	const renderDisclosure = ({ ref, ...disclosureProps }) => {
		return (
			// @ts-expect-error ts-migrate(2322) FIXME: Property 'children' does not exist on type 'Intrin... Remove this comment to see the full error message
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
