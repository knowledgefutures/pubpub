import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';
import { DragDropContext } from 'react-beautiful-dnd';

import { DragDropListing } from 'components';
import { MenuButton, MenuItem, MenuItemDivider } from 'components/Menu';
import { usePageContext } from 'utils/hooks';
import { getSchemaForKind } from 'shared/collections/schemas';

import ContentRow from './ContentRow';
import ContentOverviewFrame from './ContentOverviewFrame';
import { fuzzyMatchPub } from './util';
import { useCollectionPubs } from './collections';
import { useFilterAndSort } from './filterAndSort';
import PubSelect from './PubSelect';

const propTypes = {
	overviewData: PropTypes.object.isRequired,
};

const handleDragDrop = ({ dragResult, reorderCollectionPubs }) => {
	const { source, destination } = dragResult;
	reorderCollectionPubs(source.index, destination.index);
};

const setupCollectionPubs = (overviewData, activeCollection) => {
	const { pubs, collections } = overviewData;
	const { collectionPubs } = collections.find(
		(collection) => collection.id === activeCollection.id,
	);
	return collectionPubs
		.map((collectionPub) => {
			const pub = pubs.find((somePub) => somePub.id === collectionPub.pubId);
			if (pub) {
				return {
					...collectionPub,
					pub: pub,
				};
			}
			return null;
		})
		.filter((x) => x)
		.sort((a, b) => (a.rank || '').localeCompare(b.rank || ''));
};

const CollectionOverview = (props) => {
	const { overviewData } = props;
	const { scopeData } = usePageContext();
	const { activeCollection, activeCommunity } = scopeData.elements;

	const {
		collectionPubs,
		reorderCollectionPubs,
		setCollectionPubContextHint,
		setCollectionPubIsPrimary,
		removeCollectionPub,
		addCollectionPub,
	} = useCollectionPubs({
		initialCollectionPubs: () => setupCollectionPubs(overviewData, activeCollection),
		communityId: activeCommunity.id,
		collectionId: activeCollection.id,
	});

	const filterAndSort = useFilterAndSort();
	const collectionSchema = getSchemaForKind(activeCollection.kind);

	const filteredCollectionPubs = collectionPubs.filter(({ pub }) =>
		fuzzyMatchPub(pub, filterAndSort.filterText),
	);

	const renderCollectionPubControls = (collectionPub) => {
		return (
			<>
				<MenuButton
					aria-label="More pub options"
					buttonProps={{ small: true, minimal: true, icon: 'more' }}
					placement="bottom-end"
				>
					<MenuItem
						text="Use as primary collection"
						icon={collectionPub.isPrimary ? 'tick' : 'blank'}
						onClick={() =>
							setCollectionPubIsPrimary(collectionPub, !collectionPub.isPrimary)
						}
					/>
					<MenuItemDivider />
					<MenuItem
						text={<i>(No label)</i>}
						icon={!collectionPub.contextHint ? 'tick' : 'blank'}
						onClick={() => setCollectionPubContextHint(collectionPub, null)}
					/>
					{collectionSchema.contextHints.map((hint) => (
						<MenuItem
							key={hint.value}
							text={hint.label}
							icon={collectionPub.contextHint === hint.value ? 'tick' : 'blank'}
							onClick={() => setCollectionPubContextHint(collectionPub, hint.value)}
						/>
					))}
				</MenuButton>
				<Button
					small
					minimal
					icon="cross"
					onClick={() => removeCollectionPub(collectionPub)}
				/>
			</>
		);
	};

	const renderCollectionPub = (collectionPub, dragHandleProps, isDragging) => {
		const contextHint = collectionSchema.contextHints.find(
			(ch) => ch.value === collectionPub.contextHint,
		);
		return (
			<ContentRow
				label={contextHint && contextHint.label}
				content={collectionPub.pub}
				dragHandleProps={dragHandleProps}
				isDragging={isDragging}
				controls={renderCollectionPubControls(collectionPub)}
			/>
		);
	};

	const renderButtons = () => {
		return (
			<PubSelect
				pubs={overviewData.pubs}
				usedPubIds={collectionPubs.map((cp) => cp.pubId)}
				onSelectPub={addCollectionPub}
			>
				<Button>Add Pubs</Button>
			</PubSelect>
		);
	};

	return (
		<ContentOverviewFrame
			contentLabel="Pubs"
			filterAndSort={filterAndSort}
			buttons={renderButtons()}
		>
			<DragDropContext
				onDragEnd={(dragResult) =>
					handleDragDrop({
						dragResult: dragResult,
						reorderCollectionPubs: reorderCollectionPubs,
					})
				}
			>
				<DragDropListing
					itemId={(collectionPub) => collectionPub.pubId}
					items={filteredCollectionPubs}
					renderItem={renderCollectionPub}
					droppableId="collectionsListing"
					droppableType="COLLECTION_PUB"
					withDragHandles={true}
				/>
			</DragDropContext>
		</ContentOverviewFrame>
	);
};

CollectionOverview.propTypes = propTypes;
export default CollectionOverview;
