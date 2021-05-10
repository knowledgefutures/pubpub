import React, { useState, useMemo } from 'react';
import classNames from 'classnames';
import { NonIdealState } from '@blueprintjs/core';
import { DragDropContext, DraggableProvidedDragHandleProps, DropResult } from 'react-beautiful-dnd';

import { DashboardFrame, DragDropListing, DragHandle } from 'components';
import { useManyPubs } from 'client/utils/useManyPubs';
import { useInfiniteScroll } from 'client/utils/useInfiniteScroll';
import { indexByProperty } from 'utils/arrays';
import { Collection, CollectionPub, Maybe, PubsQuery, DefinitelyHas, UserScopeVisit } from 'types';
import { getSchemaForKind } from 'utils/collections/schemas';
import { usePageContext } from 'utils/hooks';
import { getDashUrl } from 'utils/dashboard';

import {
	OverviewFrame,
	OverviewSearchGroup,
	OverviewSection,
	QuickActions,
	QuickAction,
	ScopeSummaryList,
} from '../helpers';
import { PubOverviewRow, LoadMorePubsRow, SpecialRow } from '../overviewRows';
import { PubWithCollections } from './types';
import { useCollectionPubs, useCollectionState } from './collectionState';
import CollectionControls from './CollectionControls';
import PubMenu from './PubMenu';

require('./dashboardCollectionOverview.scss');

type Props = {
	overviewData: {
		collection: DefinitelyHas<Collection, 'scopeSummary'>;
		collectionPubs: CollectionPub[];
		pubs: PubWithCollections[];
		userScopeVisits: UserScopeVisit[];
		includesAllPubs: boolean;
	};
};

const getQuickActionsForCollection = (collection: Collection): QuickAction[] => {
	const { slug: collectionSlug } = collection;
	return [
		{
			label: 'Edit layout',
			icon: 'page-layout',
			href: getDashUrl({ collectionSlug, mode: 'layout' }),
		},
		{
			label: 'Edit metadata',
			icon: 'layers',
			href: getDashUrl({ collectionSlug, mode: 'settings', section: 'metadata' }),
		},
		collection.kind !== 'tag' && {
			label: 'Edit attribution',
			icon: 'edit',
			href: getDashUrl({ collectionSlug, mode: 'settings', section: 'attribution' }),
		},
	].filter(Boolean) as QuickAction[];
};

const DashboardCollectionOverview = (props: Props) => {
	const { overviewData } = props;
	const {
		pubs: initialPubs,
		collectionPubs: initialCollectionPubs,
		collection: initialCollection,
		includesAllPubs,
	} = overviewData;

	const {
		scopeData: {
			activePermissions: { canManage },
		},
	} = usePageContext();
	const [searchTerm, setSearchTerm] = useState('');
	const [filter, setFilter] = useState<null | Partial<PubsQuery>>(null);
	const [pubsAddedToCollection, setPubsAddedToCollection] = useState<PubWithCollections[]>([]);
	const { collection, updateCollection } = useCollectionState(initialCollection);
	const isSearchingOrFiltering = !!searchTerm || !!filter;
	const canDragDrop = !isSearchingOrFiltering && canManage;

	const {
		allQueries: { isLoading },
		currentQuery: { loadMorePubs, pubs: pubsFoundInCollection, hasLoadedAllPubs },
	} = useManyPubs<PubWithCollections>({
		initialPubs,
		initiallyLoadedAllPubs: includesAllPubs,
		batchSize: 200,
		isEager: isSearchingOrFiltering,
		query: {
			term: searchTerm,
			ordering: { field: 'collectionRank', direction: 'ASC' },
			scopedCollectionId: collection.id,
			...filter,
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
		scopeSummary,
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
				inCollection
				className={classNames(isDragging && 'collection-overview-row-is-dragging')}
				pub={pub}
				leftIconElement={canDragDrop && <DragHandle dragHandleProps={dragHandleProps} />}
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
			if (isSearchingOrFiltering) {
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

	const renderPrimaryContent = () => {
		return (
			<OverviewSection title="Explore" icon="overview" descendTitle>
				<OverviewSearchGroup
					placeholder="Search for Pubs in this Collection"
					onCommitSearchTerm={setSearchTerm}
					onUpdateSearchTerm={(t) => t === '' && setSearchTerm(t)}
					onChooseFilter={setFilter}
				/>
				<DragDropContext onDragEnd={handleDragEnd}>
					<DragDropListing
						items={renderableCollectionPubs}
						renderItem={renderCollectionPubRow}
						droppableId="collectionOverview"
						droppableType="collectionPub"
						withDragHandles={canDragDrop}
						disabled={!canDragDrop}
					/>
				</DragDropContext>
				{!hasLoadedAllPubs && <LoadMorePubsRow isLoading />}
				{renderEmptyState()}
			</OverviewSection>
		);
	};

	const renderSecondaryContent = () => {
		return (
			<>
				{canManage && (
					<OverviewSection title="Quick Actions" spaced>
						<QuickActions actions={getQuickActionsForCollection(collection)} />
					</OverviewSection>
				)}
				<OverviewSection title="About">
					<ScopeSummaryList
						scopeKind="collection"
						scope={{
							...collection,
							scopeSummary,
						}}
					/>
				</OverviewSection>
			</>
		);
	};

	return (
		<DashboardFrame
			icon={getSchemaForKind(collection.kind)?.bpDisplayIcon}
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
			<OverviewFrame primary={renderPrimaryContent()} secondary={renderSecondaryContent()} />
		</DashboardFrame>
	);
};

export default DashboardCollectionOverview;
