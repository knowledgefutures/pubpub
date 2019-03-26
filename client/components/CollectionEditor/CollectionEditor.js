/**
 * A wrapper around CollectionEditor that understands how to translate user action into updated
 * collection state -- basically a bunch of handlers.
 */
import React from 'react';
import PropTypes from 'prop-types';

import collectionType from 'types/collection';
import pubType from 'types/pub';

import collectionsApi from './api';
import {
	createPubSelection,
	createPubSelectionFromCollectionPub,
	findRankForSelection,
} from './utils';
import CollectionEditorView from './CollectionEditorView';

const propTypes = {
	communityId: PropTypes.string.isRequired,
	collection: collectionType.isRequired,
	onPersistStateChange: PropTypes.func.isRequired,
	pubs: PropTypes.arrayOf(pubType).isRequired,
};

class CollectionEditor extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			pendingOperationsCount: 0,
			selections: props.collection.collectionPubs.map((cp) =>
				createPubSelectionFromCollectionPub(cp, props.pubs, props.collection),
			),
		};
		this.handleAddSelection = this.handleAddSelection.bind(this);
		this.handleRemoveSelectionByPub = this.handleRemoveSelectionByPub.bind(this);
		this.handleReorderSelections = this.handleReorderSelections.bind(this);
		this.handleSetSelectionContextHint = this.handleSetSelectionContextHint.bind(this);
	}

	persistWithApi(fnOfApi) {
		const { collection, communityId } = this.props;
		const { pendingOperationsCount } = this.state;
		const fromApi = fnOfApi(collectionsApi(collection, communityId));
		if (typeof fromApi.then === 'function') {
			this.setState({ pendingOperationsCount: pendingOperationsCount + 1 });
			this.props.onPersistStateChange(1);
			return fromApi.then(() => {
				this.setState((state) => ({
					pendingOperationsCount: state.pendingOperationsCount - 1,
				}));
				this.props.onPersistStateChange(-1);
			});
		}
		return Promise.resolve();
	}

	handleAddSelection(pubToAdd, index) {
		const { collection } = this.props;
		const { selections } = this.state;
		const rank = findRankForSelection(selections, index);
		const selection = createPubSelection(pubToAdd, collection, rank);
		this.setState({
			selections: [...selections.slice(0, index), selection, ...selections.slice(index)],
		});
		this.persistWithApi((api) =>
			api.addPubSelection(pubToAdd.id, rank).then(({ id }) =>
				this.setState((stateNow) => ({
					selections: stateNow.selections.map((s) => {
						if (s === selection) {
							return { ...s, id: id };
						}
						return s;
					}),
				})),
			),
		);
	}

	handleRemoveSelectionByPub(pubToRemove) {
		const { selections } = this.state;
		const selectionToRemove = selections.find((selection) => selection.pub === pubToRemove);
		this.setState({
			selections: selections.filter((selection) => selection !== selectionToRemove),
		});
		this.persistWithApi((api) => api.deletePubSelection(selectionToRemove.id));
	}

	handleReorderSelections(sourceIndex, destinationIndex) {
		const { selections } = this.state;
		const nextSelections = [...selections];
		const [removed] = nextSelections.splice(sourceIndex, 1);
		const newRank = findRankForSelection(nextSelections, destinationIndex);
		const updatedSelection = {
			...removed,
			rank: newRank,
		};
		nextSelections.splice(destinationIndex, 0, updatedSelection);
		this.setState({ selections: nextSelections });
		this.persistWithApi((api) =>
			api.updatePubSelection(updatedSelection.id, { rank: newRank }),
		);
	}

	handleSetSelectionContextHint(selection, contextHint) {
		const { selections } = this.state;
		const updatedSelection = {
			...selection,
			contextHint: (contextHint.value && contextHint) || null,
		};
		this.setState({
			selections: [...selections].map((s) => {
				if (s === selection) {
					return updatedSelection;
				}
				return s;
			}),
		});
		this.persistWithApi((api) =>
			api.updatePubSelection(updatedSelection.id, {
				contextHint: contextHint.value,
			}),
		);
	}

	render() {
		const { collection, pubs } = this.props;
		const { selections } = this.state;
		return (
			<CollectionEditorView
				pubs={pubs}
				selections={selections}
				collection={collection}
				onAddSelection={this.handleAddSelection}
				onRemoveSelectionByPub={this.handleRemoveSelectionByPub}
				onReorderSelections={this.handleReorderSelections}
				onSetSelectionContextHint={this.handleSetSelectionContextHint}
			/>
		);
	}
}

CollectionEditor.propTypes = propTypes;
export default CollectionEditor;
