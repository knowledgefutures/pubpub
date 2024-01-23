import React from 'react';
import { Spinner } from '@blueprintjs/core';

import { PubByline, PubTitle } from 'components';
import { Menu, MenuItem, MenuItemDivider } from 'components/Menu';
import { usePageContext } from 'utils/hooks';
import { createReadingParamUrl, useCollectionPubs } from 'client/utils/collections';
import { pubUrl, collectionUrl } from 'utils/canonicalUrls';
import { getSchemaForKind } from 'utils/collections/schemas';
import { useInfiniteScroll } from 'client/utils/useInfiniteScroll';
import { Collection, Pub } from 'types';

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
	const menuRef = React.useRef<HTMLUListElement | null>(null);
	const { pubs, error, isLoading, hasLoadedAllPubs, requestMorePubs } = useCollectionPubs(
		updateLocalData,
		collection,
	);
	const [visible, setVisible] = React.useState(false);

	const shouldFetchMoreCollectionPubs =
		// the menu will have 0 height if it is invisible, which will
		// make the check in useInfiniteScroll always return true
		// so we only start fetching more pubs when the user clicks the menu
		visible &&
		// otherwise it'll fetch a whole bunch of pubs at once rather than 10 at a time
		!isLoading &&
		!hasLoadedAllPubs &&
		// stop fetching more pubs if there's an error.
		// possible improvement: retry once if there's an error
		!error;

	useInfiniteScroll({
		enabled: shouldFetchMoreCollectionPubs,
		element: menuRef.current,
		onRequestMoreItems: requestMorePubs,
		scrollTolerance: 0,
	});

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
			menuListRef={menuRef}
			onVisibleChange={setVisible}
		>
			<MenuItem
				icon="collection"
				text={collection.title}
				href={collectionUrl(communityData, collection)}
			/>
			<MenuItemDivider />
			{pubs?.length > 0
				? pubs.map((pub) => (
						<MenuItem
							active={currentPub.id === pub.id}
							href={readingPubUrl(pub)}
							textClassName="menu-item-text"
							icon="pubDoc"
							key={pub.id}
							text={
								<>
									<div className="title">
										<PubTitle pubData={pub} />
									</div>
									<PubByline pubData={pub} linkToUsers={false} />
								</>
							}
						/>
				  ))
				: null}
			{isLoading && (
				<MenuItem
					disabled
					className="loading-menu-item"
					textClassName="menu-item-text"
					icon={<Spinner size={30} />}
					text="Loading..."
				/>
			)}
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
