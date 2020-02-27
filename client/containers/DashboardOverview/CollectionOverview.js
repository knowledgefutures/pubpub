import React from 'react';
import PropTypes from 'prop-types';
import dateFormat from 'dateformat';
import { Button, ButtonGroup, NonIdealState } from '@blueprintjs/core';
import { DragDropContext } from 'react-beautiful-dnd';

import { DragDropListing, LinkedPageSelect } from 'components';
import { MenuButton, MenuItem, MenuItemDivider } from 'components/Menu';
import { capitalize } from 'utils';
import { usePageContext } from 'utils/hooks';
import { getSchemaForKind } from 'shared/collections/schemas';

import ContentRow from './ContentRow';
import ContentOverviewFrame from './ContentOverviewFrame';
import { fuzzyMatchPub } from './util';
import { useCollectionState } from './collectionState';
import { useFilterAndSort } from './filterAndSort';
import PubSelect from './PubSelect';

const propTypes = {
	overviewData: PropTypes.object.isRequired,
};

const handleDragDrop = ({ dragResult, reorderCollectionPubs }) => {
	const { source, destination } = dragResult;
	reorderCollectionPubs(source.index, destination.index);
};

const CollectionOverview = (props) => {
	const { overviewData } = props;
	const { scopeData } = usePageContext();
	const { activeCommunity } = scopeData.elements;

	const {
		collection,
		reorderCollectionPubs,
		setCollectionPubContextHint,
		setCollectionPubIsPrimary,
		removeCollectionPub,
		addCollectionPub,
		linkCollectionToPage,
		setCollectionPublic,
	} = useCollectionState({
		scopeData: scopeData,
		overviewData: overviewData,
	});

	const { collectionPubs, isPublic } = collection;
	const filterAndSort = useFilterAndSort();
	const collectionSchema = getSchemaForKind(collection.kind);

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
			<>
				<ButtonGroup>
					<MenuButton
						buttonContent={isPublic ? 'Public' : 'Private'}
						buttonProps={{
							icon: isPublic ? 'globe' : 'lock2',
							rightIcon: 'caret-down',
						}}
					>
						<MenuItem
							icon={isPublic ? 'tick' : 'blank'}
							text="Public"
							onClick={() => setCollectionPublic(true)}
						/>
						<MenuItem
							icon={isPublic ? 'blank' : 'tick'}
							text="Private"
							onClick={() => setCollectionPublic(false)}
						/>
					</MenuButton>
					<LinkedPageSelect
						selfContained={true}
						communityData={activeCommunity}
						collection={collection}
						onSelectPage={linkCollectionToPage}
					/>
					<PubSelect
						pubs={overviewData.pubs}
						usedPubIds={collectionPubs.map((cp) => cp.pubId)}
						onSelectPub={addCollectionPub}
					>
						<Button icon="plus">Add Pubs</Button>
					</PubSelect>
				</ButtonGroup>
				<Button icon="edit" text="New Pub" />
			</>
		);
	};

	const renderDetails = () => {
		const { createdAt } = collection;
		const label = capitalize(collectionSchema.label.singular);
		const createdOnString = dateFormat(createdAt, 'mmmm dd, yyyy');
		return `${label} • Created on ${createdOnString}`;
	};

	const renderEmptyState = () => {
		if (collectionPubs.length > 0) {
			return <NonIdealState icon="search" title="No matching Pubs to show." />;
		}
		return (
			<NonIdealState
				icon={collectionSchema.bpDisplayIcon}
				title={`This ${collectionSchema.label.singular} doesn't contain any pubs yet!`}
				description="Choose 'Add Pubs' from above to add some."
			/>
		);
	};

	return (
		<ContentOverviewFrame
			contentLabel="Pubs"
			filterAndSort={filterAndSort}
			controls={renderButtons()}
			details={renderDetails()}
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
					renderEmptyState={renderEmptyState}
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
