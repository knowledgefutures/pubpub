/**
 * This is where the magic happens, for some pretty tame definition of "magic". This component
 * builds the entire collections editor, mostly from other adjacent helper components.
 */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { DragDropContext } from 'react-beautiful-dnd';
import { Divider, NonIdealState, InputGroup } from '@blueprintjs/core';

import { getSchemaForKind } from 'shared/collections/schemas';
import collectionType from 'types/collection';
import pubType from 'types/pub';

import PubRow from './PubRow';
import DragDropListing from '../DragDropListing/DragDropListing';
import PubSelectionControls from './PubSelectionControls';
import { fuzzyMatchPub } from './utils';

// NOTE(ian): It's critical that this delimiter doesn't appear in actual ids!
const ID_WRAPPER_DELIMITER = '__';
const PUBS_DRAG_SOURCE = 'pubs';
const DND_TYPE = 'collection-editor-entry';
const SELECTIONS_DROP_TARGET = 'selections';

require('./collectionEditor.scss');

const handleTransferPub = ({
	addSelectionByPub,
	dragResult,
	removeSelectionByPub,
	reorderSelections,
	unwrapFromId,
}) => {
	const { source, destination, draggableId } = dragResult;
	if (!destination) {
		return;
	}
	if (destination.droppableId === SELECTIONS_DROP_TARGET) {
		if (source.droppableId === PUBS_DRAG_SOURCE) {
			// We need to move a pub from the available pubs to the list of created selections
			// Let's get the pub from the draggable id...
			const pub = unwrapFromId(draggableId);
			// And add it to the selections list at the specified index!
			addSelectionByPub(pub, destination.index);
		} else if (source.droppableId === SELECTIONS_DROP_TARGET) {
			// We need to reorder two items in the selection.
			reorderSelections(source.index, destination.index);
		}
	} else if (destination.droppableId === PUBS_DRAG_SOURCE) {
		if (source.droppableId === SELECTIONS_DROP_TARGET) {
			// We dragged a selection back to a pub, so we want to remove it
			// Let's get the pub from the draggable id...
			const pub = unwrapFromId(draggableId);
			// And now we remove it.
			removeSelectionByPub(pub);
		}
	}
};

const makePubIdWrapping = (pubs) => {
	const getPubById = (id) => pubs.find((pub) => pub.id === id);
	return {
		wrapToId: (listId, itemId) => listId + ID_WRAPPER_DELIMITER + itemId,
		unwrapFromId: (wrappedId) => {
			const itemId = wrappedId.split(ID_WRAPPER_DELIMITER)[1];
			return getPubById(itemId);
		},
	};
};

export const propTypes = {
	collection: collectionType.isRequired,
	onAddSelection: PropTypes.func.isRequired,
	onRemoveSelectionByPub: PropTypes.func.isRequired,
	onReorderSelections: PropTypes.func.isRequired,
	onSetSelectionContextHint: PropTypes.func.isRequired,
	selections: PropTypes.arrayOf(PropTypes.shape({ pub: pubType })).isRequired,
	pubs: PropTypes.arrayOf(pubType).isRequired,
};

const CollectionEditorView = (props) => {
	const {
		collection,
		onAddSelection,
		onRemoveSelectionByPub,
		onReorderSelections,
		onSetSelectionContextHint,
		pubs,
		selections,
	} = props;
	const schema = getSchemaForKind(collection.kind);
	const { wrapToId, unwrapFromId } = makePubIdWrapping(pubs);
	const [searchQuery, updateSearchQuery] = useState('');
	const availablePubs = pubs.filter(
		(pub) =>
			fuzzyMatchPub(pub, searchQuery) &&
			!selections.some((selection) => selection.pub === pub),
	);
	return (
		<div className="collection-editor-component">
			<DragDropContext
				onDragEnd={(dragResult) =>
					handleTransferPub({
						addSelectionByPub: onAddSelection,
						dragResult: dragResult,
						removeSelectionByPub: onRemoveSelectionByPub,
						reorderSelections: onReorderSelections,
						unwrapFromId: unwrapFromId,
					})
				}
			>
				<div className="pane pubs-pane">
					<div className="available-pubs-heading">
						<InputGroup
							round
							leftIcon="search"
							placeholder="Filter pubs"
							onChange={(e) => updateSearchQuery(e.target.value)}
						/>
					</div>
					<DragDropListing
						className="pubs-listing"
						items={availablePubs}
						itemId={(item) => wrapToId(PUBS_DRAG_SOURCE, item.id)}
						renderItem={(pub) => <PubRow pub={pub} />}
						droppableId={PUBS_DRAG_SOURCE}
						droppableType={DND_TYPE}
					/>
				</div>
				<Divider />
				<div className="pane selections-pane">
					<DragDropListing
						className="selections-listing"
						items={selections}
						itemId={(item) => wrapToId(SELECTIONS_DROP_TARGET, item.pub.id)}
						droppableId={SELECTIONS_DROP_TARGET}
						droppableType={DND_TYPE}
						withDragHandles={true}
						renderItem={(selection, dragHandleProps, isDragging) => (
							<PubRow
								pub={selection.pub}
								isDragging={isDragging}
								dragHandleProps={dragHandleProps}
								controls={
									<PubSelectionControls
										pubSelection={selection}
										onSetContext={(value) => {
											onSetSelectionContextHint(selection, value);
										}}
										onRemove={() => onRemoveSelectionByPub(selection.pub)}
									/>
								}
							/>
						)}
						renderEmptyState={() => (
							<NonIdealState
								icon={schema.bpDisplayIcon}
								title={`This ${
									schema.label.singular
								} doesn't contain any pubs yet!`}
								description="Try dragging some from the left-hand column"
							/>
						)}
					/>
				</div>
			</DragDropContext>
		</div>
	);
};

CollectionEditorView.propTypes = propTypes;

export default CollectionEditorView;
