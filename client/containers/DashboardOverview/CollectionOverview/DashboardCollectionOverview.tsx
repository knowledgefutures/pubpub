import React, { useState, useMemo } from 'react';
import classNames from 'classnames';
import { NonIdealState } from '@blueprintjs/core';
import { DragDropContext, DraggableProvidedDragHandleProps, DropResult } from 'react-beautiful-dnd';

import { DashboardFrame, DragDropListing, DragHandle } from 'components';
import { useManyPubs } from 'client/utils/useManyPubs';
import { useInfiniteScroll } from 'client/utils/useInfiniteScroll';
import { indexByProperty } from 'utils/arrays';
import { Collection, CollectionPub, Maybe } from 'utils/types';

import { OverviewSearchGroup } from '../helpers';
import { PubOverviewRow, LoadMorePubsRow, SpecialRow } from '../overviewRows';
import { PubWithCollections } from './types';
import { useCollectionPubs, useCollectionState } from './collectionState';
import CollectionControls from './CollectionControls';
import PubMenu from './PubMenu';

require('./dashboardCollectionOverview.scss');

type Props = {
	overviewData: {
		collection: Collection;
		collectionPubs: CollectionPub[];
		pubs: PubWithCollections[];
		includesAllPubs: boolean;
	};
};

const DashboardCollectionOverview = (props: Props) => {
	const { overviewData } = props;
	const {
		pubs: initialPubs,
		collectionPubs: initialCollectionPubs,
		collection: initialCollection,
		includesAllPubs,
	} = overviewData;

	const [searchTerm, setSearchTerm] = useState('');
	const [pubsAddedToCollection, setPubsAddedToCollection] = useState<PubWithCollections[]>([]);
	const { collection, updateCollection } = useCollectionState(initialCollection);
	const isSearching = searchTerm !== '';

	const {
		allQueries: { isLoading },
		currentQuery: { loadMorePubs, pubs: pubsFoundInCollection, hasLoadedAllPubs },
	} = useManyPubs<PubWithCollections>({
		initialPubs,
		initiallyLoadedAllPubs: includesAllPubs,
		batchSize: 200,
		isEager: isSearching,
		query: {
			term: searchTerm,
			ordering: { field: 'collectionRank', direction: 'ASC' },
			scopedCollectionId: collection.id,
		},
		pubOptions: {
			getCollections: true,
		},
	});

	const { pubs, pubsById, usedPubIds } = useMemo(() => {
		const nextPubs = [...pubsFoundInCollection, ...pubsAddedToCollection];
		const nextPubsById = indexByProperty(nextPubs, 'id');
		const nextUsedPubIds = new Set(Object.keys(nextPubsById));
		return { pubs: nextPubs, pubsById: nextPubsById, usedPubIds: nextUsedPubIds };
	}, [pubsFoundInCollection, pubsAddedToCollection]);

	const {
		collectionPubs,
		reorderCollectionPubs,
		addCollectionPub,
		setCollectionPubContextHint,
		setCollectionPubIsPrimary,
		removeCollectionPub,
	} = useCollectionPubs({ collection, initialCollectionPubs, pubs });

	const renderableCollectionPubs = useMemo(
		() => collectionPubs.filter((cp) => !!pubsById[cp.pubId]),
		[collectionPubs, pubsById],
	);

	useInfiniteScroll({
		enabled: !isLoading && !includesAllPubs,
		useDocumentElement: true,
		onRequestMoreItems: loadMorePubs,
		scrollTolerance: 100,
	});

	const handleDragEnd = (dropResult: DropResult) => {
		const { source, destination } = dropResult;
		if (destination) {
			reorderCollectionPubs(source.index, destination.index);
		}
	};

	const handleAddCollectionPub = (pub: PubWithCollections) => {
		setPubsAddedToCollection((current) => [...current, pub]);
		addCollectionPub(pub);
	};

	const renderCollectionPubRow = (
		collectionPub: CollectionPub,
		dragHandleProps: Maybe<DraggableProvidedDragHandleProps>,
		isDragging: boolean,
	) => {
		const pub = pubsById[collectionPub.pubId]!;
		return (
			<PubOverviewRow
				className={classNames(isDragging && 'collection-overview-row-is-dragging')}
				pub={pub}
				leftIconElement={!isSearching && <DragHandle dragHandleProps={dragHandleProps} />}
				rightElement={
					<PubMenu
						pub={pub}
						collection={collection}
						collectionPub={collectionPub}
						setCollectionPubContextHint={setCollectionPubContextHint}
						setCollectionPubIsPrimary={setCollectionPubIsPrimary}
						removeCollectionPub={removeCollectionPub}
					/>
				}
			/>
		);
	};

	const renderEmptyState = () => {
		if (pubs.length === 0 && hasLoadedAllPubs) {
			if (isSearching) {
				return <SpecialRow>No matching Pubs.</SpecialRow>;
			}
			return (
				<NonIdealState
					className="collection-empty-state"
					icon="clean"
					title="This Collection looks brand new!"
					description="Try adding a Pub from above."
				/>
			);
		}
		return null;
	};

	return (
		<DashboardFrame
			title="Overview"
			className="dashboard-collection-overview-container"
			controls={
				<CollectionControls
					usedPubIds={usedPubIds}
					collection={collection}
					updateCollection={updateCollection}
					addCollectionPub={handleAddCollectionPub}
				/>
			}
		>
			<OverviewSearchGroup
				placeholder="Search for Pubs in this Collection"
				onCommitSearchTerm={setSearchTerm}
				onUpdateSearchTerm={(t) => t === '' && setSearchTerm(t)}
			/>
			<DragDropContext onDragEnd={handleDragEnd}>
				<DragDropListing
					items={renderableCollectionPubs}
					renderItem={renderCollectionPubRow}
					droppableId="collectionOverview"
					droppableType="collectionPub"
					withDragHandles={!isSearching}
					disabled={isSearching}
				/>
			</DragDropContext>
			{!hasLoadedAllPubs && <LoadMorePubsRow isLoading />}
			{renderEmptyState()}
		</DashboardFrame>
	);
};

export default DashboardCollectionOverview;
