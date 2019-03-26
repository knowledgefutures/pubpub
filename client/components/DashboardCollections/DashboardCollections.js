import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, ControlGroup, InputGroup } from '@blueprintjs/core';
import { apiFetch } from 'utilities';

import { getSchemaForKind } from 'shared/collections/schemas';
import CollectionKindDropdown from './CollectionKindDropdown';
import CollectionRow from './CollectionRow';

require('./dashboardCollections.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	pubsData: PropTypes.object.isRequired,
	setCommunityData: PropTypes.func.isRequired,
};

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
class DashboardCollections extends Component {
	constructor(props) {
		super(props);
		this.state = {
			newCollectionValue: '',
			currentCollectionSchema: getSchemaForKind('tag'),
			error: undefined,
		};
		this.handleCreateCollection = this.handleCreateCollection.bind(this);
		this.handleUpdateCollection = this.handleUpdateCollection.bind(this);
		this.handleDeleteCollection = this.handleDeleteCollection.bind(this);
	}

	getCollectionsByKind() {
		const { collections } = this.props.communityData;
		const hasKinds = Array.from(new Set(collections.map((c) => c.kind))).sort();
		return hasKinds.map((kind) => [kind, collections.filter((c) => c.kind === kind)]);
	}

	handleCreateCollection(evt) {
		evt.preventDefault();
		const isUniqueTitle = this.props.communityData.collections.reduce((prev, curr) => {
			if (curr.title === this.state.newCollectionValue) {
				return false;
			}
			return prev;
		}, true);

		if (!isUniqueTitle) {
			return this.setState((prevState) => {
				return { error: `'${prevState.newCollectionValue}' already exists.` };
			});
		}

		this.setState({ error: undefined });
		return apiFetch('/api/collections', {
			method: 'POST',
			body: JSON.stringify({
				title: this.state.newCollectionValue,
				communityId: this.props.communityData.id,
				kind: this.state.currentCollectionSchema.kind,
			}),
		}).then((newCollection) => {
			this.setState({ newCollectionValue: '' });
			this.props.setCommunityData({
				...this.props.communityData,
				collections: [...this.props.communityData.collections, newCollection],
			});
		});
	}

	handleUpdateCollection(updatedCollection) {
		return apiFetch('/api/collections', {
			method: 'PUT',
			body: JSON.stringify({
				...updatedCollection,
				communityId: this.props.communityData.id,
			}),
		}).then(() => {
			this.props.setCommunityData({
				...this.props.communityData,
				collections: this.props.communityData.collections.map((collection) => {
					if (collection.id !== updatedCollection.id) {
						return collection;
					}
					if (!updatedCollection.pageId) {
						return { ...collection, ...updatedCollection };
					}
					return {
						...collection,
						...updatedCollection,
						page: this.props.communityData.pages.reduce((prev, curr) => {
							if (curr.id === updatedCollection.pageId) {
								return curr;
							}
							return prev;
						}, undefined),
					};
				}),
			});
		});
	}

	handleDeleteCollection(collectionId) {
		return apiFetch('/api/collections', {
			method: 'DELETE',
			body: JSON.stringify({
				id: collectionId,
				communityId: this.props.communityData.id,
			}),
		}).then(() => {
			this.props.setCommunityData({
				...this.props.communityData,
				collections: this.props.communityData.collections.filter((collection) => {
					return collection.id !== collectionId;
				}),
			});
		});
	}

	renderTopControlGroup() {
		const { currentCollectionSchema } = this.state;
		const label = currentCollectionSchema.label.singular.toLowerCase();
		// TODO(ian): figure out how to grow the InputGroup without resorting to CSS
		return (
			<form onSubmit={this.handleCreateCollection}>
				<ControlGroup>
					<InputGroup
						placeholder={`Create a new ${label}...`}
						onChange={(evt) => {
							this.setState({ newCollectionValue: evt.target.value });
						}}
						large={true}
						value={this.state.newCollectionValue}
						className="add-collection-input"
					/>
					<CollectionKindDropdown
						selectedSchema={currentCollectionSchema}
						onSelect={(schema) => this.setState({ currentCollectionSchema: schema })}
						large={true}
					/>
					<Button large={true} type="submit">
						Create
					</Button>
				</ControlGroup>
			</form>
		);
	}

	renderCollectionGroup(kind, collections) {
		const schema = getSchemaForKind(kind);
		const title = capitalize(schema.label.plural);
		return (
			<div>
				<h2>{title}</h2>
				{collections.map((collection) => (
					<CollectionRow
						communityData={this.props.communityData}
						pubsData={this.props.pubsData}
						collection={collection}
						key={collection.id}
						onUpdateCollection={this.handleUpdateCollection}
						onDeleteCollection={this.handleDeleteCollection}
					/>
				))}
			</div>
		);
	}

	render() {
		return (
			<div className="dashboard-collections-component">
				<h1 className="content-title">Collections</h1>
				<div className="details">You can use collections to yadda yadda yadda</div>
				<div className="autocomplete-wrapper">
					{this.renderTopControlGroup()}
					{this.state.error && <p className="error">{this.state.error}</p>}
				</div>
				{this.getCollectionsByKind().map(([kind, collections]) =>
					this.renderCollectionGroup(kind, collections),
				)}
			</div>
		);
	}
}

DashboardCollections.propTypes = propTypes;
export default DashboardCollections;
