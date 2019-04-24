import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
	Button,
	ButtonGroup,
	Divider,
	Menu,
	MenuItem,
	Popover,
	Position,
	Spinner,
	NonIdealState,
} from '@blueprintjs/core';
import { Suggest } from '@blueprintjs/select';
import fuzzysearch from 'fuzzysearch';

import { getSchemaForKind } from 'shared/collections/schemas';
import { Icon } from 'components';
import { apiFetch } from 'utils';

require('./collections.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	pubData: PropTypes.object.isRequired,
	updateLocalData: PropTypes.func.isRequired,
	loginData: PropTypes.object.isRequired,
};

class Collections extends Component {
	constructor(props) {
		super(props);
		this.state = {
			/* We store collectionPubs in state of this component so we can do immediate */
			/* updates and save in the background without jumpy effects */
			collectionPubs: this.props.pubData.collectionPubs,
			isLoading: false,
		};
		this.inputRef = undefined;
		this.getFilteredCollections = this.getFilteredCollections.bind(this);
		this.handleCollectionPubAdd = this.handleCollectionPubAdd.bind(this);
		this.handleCollectionPubDelete = this.handleCollectionPubDelete.bind(this);
	}

	getFilteredCollections(query, existingCollectionPubs) {
		const existingCollectionPubIds = existingCollectionPubs.map((collectionPub) => {
			return collectionPub.collection.id;
		});
		const defaultCollections = this.props.communityData.collections;
		const filteredDefaultCollections = defaultCollections
			.filter((item) => {
				const fuzzyMatchCollection = fuzzysearch(
					query.toLowerCase(),
					item.title.toLowerCase(),
				);
				const alreadyUsed = existingCollectionPubIds.indexOf(item.id) > -1;
				return !alreadyUsed && fuzzyMatchCollection;
			})
			.sort((foo, bar) => {
				if (foo.title.toLowerCase() < bar.title.toLowerCase()) {
					return -1;
				}
				if (foo.title.toLowerCase() > bar.title.toLowerCase()) {
					return 1;
				}
				return 0;
			});

		return filteredDefaultCollections;

		// const addNewCollectionOption = defaultCollections.reduce((prev, curr) => {
		// 	if (curr.title.toLowerCase() === query.toLowerCase()) {
		// 		return false;
		// 	}
		// 	return prev;
		// }, true);
		// const newCollectionOption =
		// 	query && addNewCollectionOption ? [{ title: query.trim() }] : [];

		// const outputCollections = [...newCollectionOption, ...filteredDefaultCollections];
		// return outputCollections;
	}

	handleCollectionPubAdd(collection) {
		this.inputRef.focus();
		this.setState({ isLoading: true });
		const firstCreateCollectionPromise = collection.id
			? Promise.resolve(collection)
			: apiFetch('/api/collections', {
					method: 'POST',
					body: JSON.stringify({
						title: collection.title.trim(),
						communityId: this.props.communityData.id,
						kind: 'tag',
					}),
			  });
		return firstCreateCollectionPromise
			.then((collectionWithId) =>
				apiFetch('/api/collectionPubs', {
					method: 'POST',
					body: JSON.stringify({
						collectionId: collectionWithId.id,
						pubId: this.props.pubData.id,
						communityId: this.props.communityData.id,
					}),
				}).then((collectionPub) => ({ ...collectionPub, collection: collectionWithId })),
			)
			.then((result) => {
				this.setState((prevState) => {
					const newCollectionPubs = [...prevState.collectionPubs, result];
					this.props.updateLocalData('pub', {
						...this.props.pubData,
						collectionPubs: newCollectionPubs,
					});
					return { collectionPubs: newCollectionPubs };
				});
				this.setState({ isLoading: false });
			});
	}

	handleCollectionPubDelete(collectionPubId) {
		this.setState(
			(prevState) => {
				const newCollectionPubs = prevState.collectionPubs.filter((collectionPub) => {
					return collectionPub.id !== collectionPubId;
				});
				return { collectionPubs: newCollectionPubs, isLoading: true };
			},
			() => {
				apiFetch('/api/collectionPubs', {
					method: 'DELETE',
					body: JSON.stringify({
						id: collectionPubId,
						communityId: this.props.communityData.id,
					}),
				}).then(() => {
					this.props.updateLocalData('pub', {
						...this.props.pubData,
						collectionPubs: this.state.collectionPubs,
					});
					this.setState({ isLoading: false });
				});
			},
		);
	}

	handleCollectionPubSetPrimary(collectionPubId, setPrimary = true) {
		const { communityData, pubData, updateLocalData } = this.props;
		const isPrimary = (collectionPub) => {
			if (setPrimary) {
				return collectionPub.id === collectionPubId;
			}
			return false;
		};
		this.setState(
			(state) => ({
				isLoading: true,
				collectionPubs: state.collectionPubs.map((collectionPub) => ({
					...collectionPub,
					isPrimary: isPrimary(collectionPub),
				})),
			}),
			() =>
				apiFetch('/api/collectionPubs/setPrimary', {
					method: 'PUT',
					body: JSON.stringify({
						id: collectionPubId,
						communityId: communityData.id,
					}),
				}).then(() => {
					updateLocalData('pub', {
						...pubData,
						collectionPubs: this.state.collectionPubs,
					});
					this.setState({ isLoading: false });
				}),
		);
	}

	renderAddCollection() {
		const { collectionPubs } = this.state;
		return (
			<Suggest
				items={collectionPubs}
				inputProps={{
					placeholder: 'Add to collection...',
					className: 'bp3-large',
					inputRef: (ref) => {
						this.inputRef = ref;
					},
				}}
				itemListPredicate={this.getFilteredCollections}
				inputValueRenderer={() => {
					return '';
				}}
				itemRenderer={(item, { handleClick, modifiers }) => {
					return (
						<li key={item.id || 'empty-user-create'}>
							<button
								type="button"
								tabIndex={-1}
								onClick={handleClick}
								className={
									modifiers.active ? 'bp3-menu-item bp3-active' : 'bp3-menu-item'
								}
							>
								{!item.id && <span>Create new tag: </span>}
								<span className="autocomplete-name">
									{item.title}
									{item.id && !item.isPublic && (
										<Icon className="lock-icon" icon="lock2" />
									)}
								</span>
							</button>
						</li>
					);
				}}
				resetOnSelect={true}
				onItemSelect={this.handleCollectionPubAdd}
				noResults={<MenuItem disabled text="No results" />}
				popoverProps={{
					// isOpen: this.state.queryValue,
					popoverClassName: 'bp3-minimal collections-autocomplete-popover',
					position: Position.BOTTOM_LEFT,
					modifiers: {
						preventOverflow: { enabled: false },
						hide: { enabled: false },
					},
				}}
			/>
		);
	}

	renderCollectionRow(collectionPub) {
		const { collection, isPrimary, id } = collectionPub;
		const { title, isPublic } = collection;
		const schema = getSchemaForKind(collection.kind);
		return (
			<div key={collectionPub.id}>
				<div className="collection-row">
					<div className="title">
						<Icon icon={schema.bpDisplayIcon} />
						{title}
						{!collection.isPublic && <Icon icon="lock2" className="lock-icon" />}
						{isPrimary && (
							<span className="is-primary-notice bp3-text-muted">
								(Primary collection)
							</span>
						)}
					</div>
					<ButtonGroup className="buttons">
						<Popover
							minimal
							content={
								<Menu>
									{collection.kind !== 'tag' && isPublic && (
										<MenuItem
											icon="highlight"
											text={
												isPrimary
													? 'Stop using as primary collection'
													: 'Use as primary collection'
											}
											onClick={() =>
												this.handleCollectionPubSetPrimary(id, !isPrimary)
											}
										/>
									)}
									<MenuItem
										intent="danger"
										icon="trash"
										onClick={() => this.handleCollectionPubDelete(id)}
										text="Remove from collection"
									/>
								</Menu>
							}
						>
							<Button minimal="true" icon="more" />
						</Popover>
					</ButtonGroup>
				</div>
				<Divider />
			</div>
		);
	}

	renderCollections() {
		return (
			<div className="collections-wrapper">
				<Divider />
				{this.state.collectionPubs
					.sort((a, b) => {
						if (a.collection.kind === 'tag' && b.collection.kind !== 'tag') {
							return 1;
						}
						return a.kind - b.kind;
					})
					.map((collectionPub) => this.renderCollectionRow(collectionPub))}
			</div>
		);
	}

	render() {
		const { isLoading } = this.state;
		return (
			<div className="pub-manage_collections-component">
				{isLoading && (
					<div className="save-wrapper">
						<Spinner size={Spinner.SIZE_SMALL} /> Saving...
					</div>
				)}
				<h2>Collections</h2>
				<p>
					A pub can belong to many collections. You can choose here which (non-tag)
					collection acts as its <em>primary collection</em>, and appears as part of the
					pub&apos;s citations and DOI deposit information.
				</p>
				{this.props.loginData.isAdmin && (
					<p>
						Collections can be created and edited in the{' '}
						<a href="/dashboard/collections">community Manage dashboard</a>.
					</p>
				)}
				{this.renderAddCollection()}
				{this.renderCollections()}
				{!this.state.collectionPubs.length && (
					<NonIdealState
						icon="widget"
						title="This pub does not yet belong to any collections"
					/>
				)}
			</div>
		);
	}
}

Collections.propTypes = propTypes;
export default Collections;
