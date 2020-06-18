import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, ButtonGroup, Divider, Menu, MenuItem, Popover, Position } from '@blueprintjs/core';
import { Suggest } from '@blueprintjs/select';
import fuzzysearch from 'fuzzysearch';

import { Icon } from 'components';
import { getSchemaForKind } from 'utils/collections/schemas';
import { getDashUrl } from 'utils/dashboard';
import { apiFetch } from 'client/utils/apiFetch';

require('./collections.scss');

const propTypes = {
	canCreateCollections: PropTypes.bool.isRequired,
	communityData: PropTypes.object.isRequired,
	pubData: PropTypes.object.isRequired,
	updatePubData: PropTypes.func.isRequired,
	promiseWrapper: PropTypes.func.isRequired,
};

class Collections extends Component {
	constructor(props) {
		super(props);
		this.state = {
			/* We store collectionPubs in state of this component so we can do immediate */
			/* updates and save in the background without jumpy effects */
			collectionPubs: this.props.pubData.collectionPubs,
		};
		this.inputRef = undefined;
		this.getFilteredCollections = this.getFilteredCollections.bind(this);
		this.handleCollectionPubAdd = this.handleCollectionPubAdd.bind(this);
		this.handleCollectionPubDelete = this.handleCollectionPubDelete.bind(this);
		this.apiFetch = this.apiFetch.bind(this);
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
	}

	apiFetch(...args) {
		const { promiseWrapper } = this.props;
		return promiseWrapper(apiFetch(...args));
	}

	handleCollectionPubAdd(collection) {
		this.inputRef.focus();
		const firstCreateCollectionPromise = collection.id
			? Promise.resolve(collection)
			: this.apiFetch('/api/collections', {
					method: 'POST',
					body: JSON.stringify({
						title: collection.title.trim(),
						communityId: this.props.communityData.id,
						kind: 'tag',
					}),
			  });
		return firstCreateCollectionPromise
			.then((collectionWithId) =>
				this.apiFetch('/api/collectionPubs', {
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
					this.props.updatePubData({
						collectionPubs: newCollectionPubs,
					});
					return { collectionPubs: newCollectionPubs };
				});
			});
	}

	handleCollectionPubDelete(collectionPub) {
		this.setState(
			(prevState) => {
				const newCollectionPubs = prevState.collectionPubs.filter((item) => {
					return item.id !== collectionPub.id;
				});
				return { collectionPubs: newCollectionPubs };
			},
			() => {
				this.apiFetch('/api/collectionPubs', {
					method: 'DELETE',
					body: JSON.stringify({
						id: collectionPub.id,
						communityId: this.props.communityData.id,
						collectionId: collectionPub.collectionId,
					}),
				}).then(() => {
					this.props.updatePubData({
						collectionPubs: this.state.collectionPubs,
					});
				});
			},
		);
	}

	handleCollectionPubSetPrimary(collectionPub, setPrimary = true) {
		const { communityData, updatePubData } = this.props;
		const isPrimary = (item) => {
			if (setPrimary) {
				return item.id === collectionPub.id;
			}
			return false;
		};
		this.setState(
			(state) => ({
				collectionPubs: state.collectionPubs.map((item) => ({
					...item,
					isPrimary: isPrimary(item),
				})),
			}),
			() =>
				this.apiFetch('/api/collectionPubs/setPrimary', {
					method: 'PUT',
					body: JSON.stringify({
						isPrimary: setPrimary,
						id: collectionPub.id,
						communityId: communityData.id,
						collectionId: collectionPub.collectionId,
					}),
				}).then(() => {
					updatePubData({
						collectionPubs: this.state.collectionPubs,
					});
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
		const { collection, isPrimary } = collectionPub;
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
												this.handleCollectionPubSetPrimary(
													collectionPub,
													!isPrimary,
												)
											}
										/>
									)}
									<MenuItem
										intent="danger"
										icon="trash"
										onClick={() =>
											this.handleCollectionPubDelete(collectionPub)
										}
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
		return (
			<div className="pub-settings-container_collections-component">
				<p>
					A pub can belong to many collections. You can choose here which (non-tag)
					collection acts as its <em>primary collection</em>, and appears as part of the
					pub&apos;s citations and DOI deposit information.
				</p>
				{this.props.canCreateCollections && (
					<p>
						Visit the <a href={getDashUrl({ mode: 'overview' })}>Community overview</a>{' '}
						to create collections.
					</p>
				)}
				{this.renderAddCollection()}
				{this.renderCollections()}
			</div>
		);
	}
}

Collections.propTypes = propTypes;
export default Collections;
