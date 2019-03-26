import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Position, Spinner, Tag, MenuItem } from '@blueprintjs/core';
import { Suggest } from '@blueprintjs/select';
import fuzzysearch from 'fuzzysearch';
import Icon from 'components/Icon/Icon';
import { apiFetch } from 'utilities';

require('./pubOptionsCollections.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	pubData: PropTypes.object.isRequired,
	setPubData: PropTypes.func.isRequired,
};

class PubOptionsCollections extends Component {
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

		const addNewCollectionOption = defaultCollections.reduce((prev, curr) => {
			if (curr.title.toLowerCase() === query.toLowerCase()) {
				return false;
			}
			return prev;
		}, true);
		const newCollectionOption = query && addNewCollectionOption ? [{ title: query }] : [];

		const outputCollections = [...newCollectionOption, ...filteredDefaultCollections];
		return outputCollections;
	}

	handleCollectionPubAdd(collection) {
		this.inputRef.focus();
		return apiFetch('/api/collectionPubs/legacy', {
			method: 'POST',
			body: JSON.stringify({
				kind: 'tag',
				title: collection.title,
				collectionId: collection.id,
				pubId: this.props.pubData.id,
				communityId: this.props.communityData.id,
			}),
		}).then((result) => {
			this.setState((prevState) => {
				const newCollectionPubs = [...prevState.collectionPubs, result];
				this.props.setPubData({
					...this.props.pubData,
					collectionPubs: newCollectionPubs,
				});
				return { collectionPubs: newCollectionPubs };
			});
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
				apiFetch('/api/collectionPubs/legacy', {
					method: 'DELETE',
					body: JSON.stringify({
						collectionPubId: collectionPubId,
						pubId: this.props.pubData.id,
						communityId: this.props.communityData.id,
					}),
				}).then(() => {
					this.props.setPubData({
						...this.props.pubData,
						collectionPubs: this.state.collectionPubs,
					});
					this.setState({ isLoading: false });
				});
			},
		);
	}

	render() {
		const collectionPubs = this.state.collectionPubs;
		return (
			<div className="pub-options-collections-component">
				{this.state.isLoading && (
					<div className="save-wrapper">
						<Spinner small={true} /> Saving...
					</div>
				)}
				<h1>Collections</h1>
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
										modifiers.active
											? 'bp3-menu-item bp3-active'
											: 'bp3-menu-item'
									}
								>
									{!item.id && <span>Create new tag: </span>}
									<span className="autocomplete-name">
										{item.id && !item.isPublic && <Icon icon="lock2" />}
										{item.title}
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
						popoverClassName: 'bp3-minimal collection-autocomplete-popover',
						position: Position.BOTTOM_LEFT,
						modifiers: {
							preventOverflow: { enabled: false },
							hide: { enabled: false },
						},
					}}
				/>

				<div className="collections-wrapper">
					{collectionPubs.map((collectionPub) => {
						return (
							<Tag
								key={collectionPub.id}
								className="bp3-minimal bp3-intent-primary"
								large={true}
								onRemove={() => {
									this.handleCollectionPubDelete(collectionPub.id);
								}}
							>
								{!collectionPub.collection.isPublic && <Icon icon="lock2" />}
								{collectionPub.collection.title}
							</Tag>
						);
					})}
				</div>
			</div>
		);
	}
}

PubOptionsCollections.propTypes = propTypes;
export default PubOptionsCollections;
