import React, { useState, useMemo } from 'react';
import classNames from 'classnames';
import { AnchorButton, NonIdealState } from '@blueprintjs/core';
import { DragDropContext, DraggableProvidedDragHandleProps, DropResult } from 'react-beautiful-dnd';
import Color from 'color';

import { Banner, DashboardFrame, DragDropListing, DragHandle } from 'components';
import { useManyPubs } from 'client/utils/useManyPubs';
import { useInfiniteScroll } from 'client/utils/useInfiniteScroll';
import { indexByProperty } from 'utils/arrays';
import {
	Collection,
	CollectionPub,
	PubWithCollections,
	Maybe,
	DefinitelyHas,
	UserScopeVisit,
} from 'types';
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
	OverviewSearchFilter,
} from '../helpers';
import { PubOverviewRow, LoadMorePubsRow, SpecialRow } from '../overviewRows';
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
	hasEnabledSubmissionWorkflow: boolean;
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
	const { overviewData, hasEnabledSubmissionWorkflow } = props;
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
		communityData,
	} = usePageContext();
	const [searchTerm, setSearchTerm] = useState('');
	const [filter, setFilter] = useState<null | OverviewSearchFilter>(null);
	const [pubsAddedToCollection, setPubsAddedToCollection] = useState<PubWithCollections[]>([]);
	const { collection, updateCollection } = useCollectionState(initialCollection);
	const query = filter?.query;
	const isSearchingOrFiltering = !!searchTerm || !!query;
	const canDragDrop = !isSearchingOrFiltering && canManage;

	const {
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
			...query,
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
		enabled: !includesAllPubs,
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
				inCollection={collection}
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

	const lighterAccentColor = useMemo(
		() => Color(communityData.accentColorDark).alpha(0.1),
		[communityData.accentColorDark],
	);

	const renderRightElement = (
		<AnchorButton
			minimal={true}
			intent="primary"
			className="view-submissions-button"
			href={getDashUrl({
				collectionSlug: collection.slug,
				mode: 'submissions',
			})}
		>
			View submissions
		</AnchorButton>
	);

	const renderBanner = (bannerText: String) => {
		return (
			<Banner
				bannerText={bannerText}
				accentColor={lighterAccentColor}
				right={renderRightElement}
			/>
		);
	};

	const submissionBanner =
		hasEnabledSubmissionWorkflow && canManage
			? renderBanner('Submissions are now open for this collection!')
			: null;

	return (
		<DashboardFrame
			banner={submissionBanner}
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
