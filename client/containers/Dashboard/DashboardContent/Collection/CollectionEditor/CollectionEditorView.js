/**
 * This is where the magic happens, for some pretty tame definition of "magic". This component
 * builds the entire collections editor, mostly from other adjacent helper components.
 */
import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { DragDropContext } from 'react-beautiful-dnd';
import { Divider, NonIdealState, InputGroup, Card, Button } from '@blueprintjs/core';

import { getSchemaForKind } from 'shared/collections/schemas';
import collectionType from 'types/collection';
import { pubDataProps } from 'types/pub';
import { DragDropListing, TabToShow } from 'components';

import { useKey } from 'react-use';
import PubRow from './PubRow';
import PubSelectionControls from './PubSelectionControls';
import PubListingControls from './PubListingControls';
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
	selections: PropTypes.arrayOf(PropTypes.shape({ pub: pubDataProps })).isRequired,
	pubs: PropTypes.arrayOf(pubDataProps).isRequired,
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
	const [isKeyboardHelpSticky, setIsKeyboardHelpSticky] = useState(false);

	const keyboardExplainerRef = useRef();
	const filterBarRef = useRef();
	const pubsPaneRef = useRef();
	const selectionsPaneRef = useRef();

	const focusRef = (evt, ref) => {
		const shouldCancel = evt && evt.target && evt.target === filterBarRef.current;
		if (shouldCancel) {
			return;
		}
		if (ref && ref.current && typeof ref.current.focus === 'function') {
			if (evt) {
				evt.preventDefault();
			}
			ref.current.focus();
		}
	};

	useKey('h', (evt) => focusRef(evt, keyboardExplainerRef));
	useKey('f', (evt) => focusRef(evt, filterBarRef));
	useKey('p', (evt) => focusRef(evt, pubsPaneRef));
	useKey('s', (evt) => focusRef(evt, selectionsPaneRef));

	const availablePubs = pubs.filter(
		(pub) =>
			fuzzyMatchPub(pub, searchQuery) &&
			!selections.some((selection) => selection.pub === pub),
	);

	const renderKeyboardExplainer = () => {
		return (
			<TabToShow
				ref={keyboardExplainerRef}
				className="collection-editor-keyboard-explainer-component"
				tagName="div"
				holdOpen={isKeyboardHelpSticky}
				onFocus={() => setIsKeyboardHelpSticky(true)}
			>
				<Card>
					<h6>Keyboard shorcuts</h6>
					Editing collections using the keyboard
					<ul>
						<li>
							<span className="bp3-key">p</span> choose pubs for selection
						</li>
						<li>
							<span className="bp3-key">s</span> edit selected pubs
						</li>
						<li>
							<span className="bp3-key">f</span> filter pubs
						</li>
						<li>
							<span className="bp3-key">h</span> show help again
						</li>
						<li>
							<span className="bp3-key">space</span> pick up/put down pub
						</li>
						<li>
							<span className="bp3-key">&rarr;</span> move pub into selections
						</li>
						<li>
							<span className="bp3-key">&larr;</span> move pub out of selections
						</li>
					</ul>
					<Button
						onClick={() => {
							setIsKeyboardHelpSticky(false);
							focusRef(null, pubsPaneRef);
						}}
					>
						Dismiss
					</Button>
				</Card>
			</TabToShow>
		);
	};

	return (
		<React.Fragment>
			<div className="collection-editor-component">
				{renderKeyboardExplainer()}
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
					<div className="pane pubs-pane" tabIndex={-1} ref={pubsPaneRef}>
						<div className="available-pubs-heading">
							<InputGroup
								round
								inputRef={filterBarRef}
								leftIcon="search"
								placeholder="Filter pubs"
								onChange={(e) => updateSearchQuery(e.target.value)}
							/>
						</div>
						<DragDropListing
							className="pubs-listing"
							items={availablePubs}
							itemId={(item) => wrapToId(PUBS_DRAG_SOURCE, item.id)}
							renderItem={(pub) => (
								<PubRow
									pub={pub}
									controls={
										<PubListingControls onAdd={() => onAddSelection(pub)} />
									}
								/>
							)}
							droppableId={PUBS_DRAG_SOURCE}
							droppableType={DND_TYPE}
						/>
					</div>
					<Divider />
					<div className="pane selections-pane" tabIndex={-1} ref={selectionsPaneRef}>
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
									title={`This ${schema.label.singular} doesn't contain any pubs yet!`}
									description="Try dragging some from the left-hand column"
								/>
							)}
						/>
					</div>
				</DragDropContext>
			</div>
		</React.Fragment>
	);
};

CollectionEditorView.propTypes = propTypes;

export default CollectionEditorView;
