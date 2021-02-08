import React, { useMemo } from 'react';
import classNames from 'classnames';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { Divider, Button, Tooltip } from '@blueprintjs/core';
import { Button as RKButton } from 'reakit/Button';

import { Collection, CollectionPub as BareCollectionPub, Pub } from 'utils/types';
import { DragDropListing, Icon, QueryListDropdown } from 'components';
import { findRankInRankedList, sortByRank } from 'utils/rank';
import { getIconForCollectionKind } from 'utils/collections/schemas';
import { getUserManagedCollections } from 'utils/collections/permissions';
import { getPrimaryCollection } from 'utils/collections/primary';
import { usePageContext, usePendingChanges } from 'utils/hooks';
import { fuzzyMatchCollection } from 'utils/fuzzyMatch';
import * as api from 'client/utils/collections/api';
import { getDashUrl } from 'utils/dashboard';
import PrimaryCollectionExplanation from '../PrimaryCollectionExplanation/PrimaryCollectionExplanation';

require('./pubCollectionsListing.scss');

type CollectionPub = BareCollectionPub & { collection: Collection };

type Props = {
	canManage: boolean;
	allCollections: Collection[];
	pub: Pub;
	collectionPubs: CollectionPub[];
	onQueryListClose?: () => unknown;
	updateCollectionPubs: (collectionPubs: CollectionPub[]) => unknown;
	renderTriggerButtonForQueryList?: () => React.ReactNode;
	renderDragElementInPortal?: boolean;
};

const PubCollectionsListing = (props: Props) => {
	const {
		allCollections,
		canManage,
		collectionPubs,
		pub,
		renderTriggerButtonForQueryList,
		updateCollectionPubs,
		onQueryListClose,
		renderDragElementInPortal,
	} = props;
	const { communityData, scopeData } = usePageContext();
	const { pendingPromise } = usePendingChanges();

	const { canAddCollections, canRemoveCollectionIds } = useMemo(() => {
		const addedCollectionIds = new Set(collectionPubs.map((cp) => cp.collectionId));
		const userManagedCollections = getUserManagedCollections(allCollections, scopeData);
		return {
			canAddCollections: userManagedCollections.filter(
				(collection) => !addedCollectionIds.has(collection.id),
			),
			canRemoveCollectionIds: new Set(
				userManagedCollections.map((c) => c.id).filter((id) => addedCollectionIds.has(id)),
			),
		};
	}, [allCollections, scopeData, collectionPubs]);

	const primaryCollection = getPrimaryCollection(collectionPubs);

	const handleAddCollectionPub = async (collection: Collection) => {
		const newCollectionPub = await pendingPromise(
			api.addCollectionPub({
				communityId: communityData.id,
				pubId: pub.id,
				collectionId: collection.id,
			}),
		);
		updateCollectionPubs([...collectionPubs, { ...newCollectionPub, collection }]);
	};

	const handleRemoveCollectionPub = (id: string) => {
		pendingPromise(api.removeCollectionPub({ communityId: communityData.id, id }));
		updateCollectionPubs(collectionPubs.filter((cp) => cp.id !== id));
	};

	const handleDragEnd = (result: DropResult) => {
		const {
			source: { index: sourceIndex },
			// @ts-expect-error ts-migrate(2339) FIXME: Property 'index' does not exist on type 'Draggable... Remove this comment to see the full error message
			destination: { index: destinationIndex },
		} = result;
		const nextCollectionPubs = [...collectionPubs];
		const [removed] = nextCollectionPubs.splice(sourceIndex, 1);
		const newPubRank = findRankInRankedList(nextCollectionPubs, destinationIndex, 'pubRank');
		const updatedValue = {
			...removed,
			pubRank: newPubRank,
		};
		nextCollectionPubs.splice(destinationIndex, 0, updatedValue);
		pendingPromise(
			api.updateCollectionPub({
				communityId: communityData.id,
				id: updatedValue.id,
				update: { pubRank: newPubRank },
			}),
		);
		updateCollectionPubs(nextCollectionPubs);
	};

	const renderCollectionTitle = (
		collection: Collection,
		linkToCollection = true,
		onClick?: () => unknown,
		otherClassName?: string,
	) => {
		const inner = (
			<>
				<Icon
					icon={getIconForCollectionKind(collection.kind) as string}
					className="collection-kind-icon"
				/>
				{linkToCollection ? (
					<a
						href={getDashUrl({ collectionSlug: collection.slug })}
						className="title"
						target="_blank"
						rel="noopener noreferrer"
					>
						{collection.title}
					</a>
				) : (
					collection.title
				)}
				{!collection.isPublic && <Icon icon="lock2" className="title-icon" />}
				{primaryCollection?.id === collection.id && (
					<Tooltip content="Primary Collection">
						<Icon icon="star" className="title-icon" ariaLabel="Primary Collection" />
					</Tooltip>
				)}
			</>
		);

		const className = classNames(
			'pub-collections-listing-component_collection-title',
			!!onClick && 'interactive',
			otherClassName,
		);

		if (onClick) {
			return (
				<RKButton as="div" onClick={onClick} className={className} key={collection.id}>
					{inner}
				</RKButton>
			);
		}

		return (
			<div className={className} key={collection.id}>
				{inner}
			</div>
		);
	};

	const renderAvailableCollection = (
		collection: Collection,
		{ handleClick, modifiers: { active } },
	) => {
		return renderCollectionTitle(collection, false, handleClick, active && 'active');
	};

	const renderCollectionPub = (
		collectionPub: CollectionPub,
		dragHandleProps: any,
		isDragging: boolean,
	) => {
		const { collection } = collectionPub;
		const canRemove = canRemoveCollectionIds.has(collection.id);
		return (
			<div key={collectionPub.id}>
				<div
					className={classNames(
						'pub-collections-listing-component_collection-row',
						isDragging && 'is-dragging',
					)}
				>
					{dragHandleProps && (
						<span {...dragHandleProps}>
							<Icon icon="drag-handle-vertical" />
						</span>
					)}
					{renderCollectionTitle(collection)}
					{canRemove && (
						<Button
							small
							minimal
							icon="small-cross"
							aria-label="Remove"
							onClick={() => handleRemoveCollectionPub(collectionPub.id)}
						/>
					)}
				</div>
				<Divider />
			</div>
		);
	};

	const renderQueryList = (triggerButton) => {
		if (canAddCollections.length > 0) {
			return (
				<QueryListDropdown
					itemPredicate={(query, collection) => fuzzyMatchCollection(collection, query)}
					items={canAddCollections}
					itemRenderer={renderAvailableCollection}
					emptyListPlaceholder="No Collections match this search."
					searchPlaceholder="Search for Collections"
					onItemSelect={handleAddCollectionPub}
					position="bottom-left"
					onClose={onQueryListClose}
					usePortal={false}
				>
					{triggerButton}
				</QueryListDropdown>
			);
		}
		return null;
	};

	if (renderTriggerButtonForQueryList) {
		return renderQueryList(renderTriggerButtonForQueryList());
	}

	if (collectionPubs.length === 0 && canAddCollections.length === 0) {
		return <>You don't have permission to add this Pub to any Collections.</>;
	}

	return (
		<div className="pub-collections-listing-component">
			{renderQueryList(
				<Button icon="plus" className="add-button">
					Add to Collections
				</Button>,
			)}
			{collectionPubs.length > 0 && (
				<div className="reorder-explanation">
					Reorder Collections to indicate their importance to this Pub; the highest
					public, non-Tag Collection will serve as its <PrimaryCollectionExplanation />.
				</div>
			)}
			<DragDropContext onDragEnd={handleDragEnd}>
				<DragDropListing
					items={sortByRank(collectionPubs, 'pubRank')}
					renderItem={renderCollectionPub}
					renderEmptyState={() => <>This Pub isn't in any Collections yet.</>}
					droppableId="pubCollectionsListing"
					droppableType="COLLECTION_PUB"
					withDragHandles={canManage}
					renderDragElementInPortal={renderDragElementInPortal}
				/>
			</DragDropContext>
		</div>
	);
};

export default PubCollectionsListing;
