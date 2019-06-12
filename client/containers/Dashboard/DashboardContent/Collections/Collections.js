import React from 'react';
import PropTypes from 'prop-types';
import fuzzysearch from 'fuzzysearch';
import { ControlGroup, InputGroup, NonIdealState } from '@blueprintjs/core';
import { apiFetch } from 'utils';

import { getSchemaForKind } from 'shared/collections/schemas';
import CollectionKindDropdown from './CollectionKindDropdown';
import CollectionTile from './CollectionTile';
import NewCollectionCard from './NewCollectionCard';

require('./collections.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	setCommunityData: PropTypes.func.isRequired,
};
class Collections extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			matchCollectionQuery: null,
			matchCollectionSchema: null,
		};
		this.handleCreateCollection = this.handleCreateCollection.bind(this);
		this.handleUpdateCollection = this.handleUpdateCollection.bind(this);
		this.handleDeleteCollection = this.handleDeleteCollection.bind(this);
	}

	getDisplayedCollections() {
		const {
			communityData: { collections },
		} = this.props;
		const { matchCollectionQuery, matchCollectionSchema } = this.state;
		return collections
			.filter((collection) => {
				const matchesQuery =
					!matchCollectionQuery ||
					fuzzysearch(matchCollectionQuery.toLowerCase(), collection.title.toLowerCase());
				const matchesKind =
					!matchCollectionSchema || matchCollectionSchema.kind === collection.kind;
				return matchesQuery && matchesKind;
			})
			.sort((foo, bar) => {
				if (foo.createdAt < bar.createdAt) {
					return 1;
				}
				if (foo.createdAt > bar.createdAt) {
					return -1;
				}
				if (foo.title < bar.title) {
					return -1;
				}
				if (foo.title > bar.title) {
					return 1;
				}
				return 0;
			});
	}

	handleCreateCollection(title, kind) {
		return apiFetch('/api/collections', {
			method: 'POST',
			body: JSON.stringify({
				communityId: this.props.communityData.id,
				title: title,
				kind: kind,
			}),
		}).then((newCollection) => {
			const { matchCollectionSchema } = this.state;
			if (matchCollectionSchema && matchCollectionSchema.kind !== newCollection.kind) {
				this.setState({ matchCollectionSchema: null });
			}
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
					if (!Object.keys(updatedCollection).includes('pageId')) {
						return { ...collection, ...updatedCollection };
					}
					return {
						...collection,
						...updatedCollection,
						page: this.props.communityData.pages.find(
							(page) => page.id === updatedCollection.pageId,
						),
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
		const { matchCollectionSchema, matchCollectionQuery } = this.state;
		return (
			<div className="top-controls">
				<div className="top-controls-cards">
					<NewCollectionCard
						schema={getSchemaForKind('tag')}
						header="Create a tag"
						onCreateCollection={(name) => this.handleCreateCollection(name, 'tag')}
						description={
							<React.Fragment>
								A lightweight collection of thematically related pubs
							</React.Fragment>
						}
					/>
					<NewCollectionCard
						schema={getSchemaForKind('issue')}
						header="Create an issue"
						onCreateCollection={(name) => this.handleCreateCollection(name, 'issue')}
						description={
							<React.Fragment>
								Organize your pubs into an issue of your journal
							</React.Fragment>
						}
					/>
					<NewCollectionCard
						schema={getSchemaForKind('book')}
						header="Create a book"
						onCreateCollection={(name) => this.handleCreateCollection(name, 'book')}
						description={
							<React.Fragment>
								Arrange pubs into chapters for a longer reading experience
							</React.Fragment>
						}
					/>
					<NewCollectionCard
						schema={getSchemaForKind('conference')}
						onCreateCollection={(name) =>
							this.handleCreateCollection(name, 'conference')
						}
						header="Create a conference"
						description={<React.Fragment>Host a conference on PubPub</React.Fragment>}
					/>
				</div>
				{this.props.communityData.collections.length > 0 && (
					<ControlGroup className="search-and-filter bp3-large">
						<CollectionKindDropdown
							selectedSchema={matchCollectionSchema}
							onSelect={(schema) => this.setState({ matchCollectionSchema: schema })}
						/>
						<InputGroup
							className="search-bar bp3-large"
							leftIcon="search"
							value={matchCollectionQuery}
							onChange={(e) =>
								this.setState({ matchCollectionQuery: e.target.value })
							}
							placeholder="Filter collections"
						/>
					</ControlGroup>
				)}
			</div>
		);
	}

	renderCollections() {
		const { communityData } = this.props;
		const { matchCollectionQuery, matchCollectionSchema } = this.state;
		const isFiltering = matchCollectionQuery || matchCollectionSchema;
		const collections = this.getDisplayedCollections();
		if (collections.length > 0) {
			return (
				<div className="collections">
					{collections.map((collection) => (
						<CollectionTile
							key={collection.id}
							communityData={communityData}
							collection={collection}
							onDeleteCollection={() => this.handleDeleteCollection(collection.id)}
							onUpdateCollection={(updatedValue) =>
								this.handleUpdateCollection({ ...updatedValue, id: collection.id })
							}
						/>
					))}
				</div>
			);
		}
		return (
			<div className="empty-state">
				<NonIdealState
					icon={matchCollectionSchema ? matchCollectionSchema.bpDisplayIcon : 'tag'}
					title={isFiltering ? 'No matching collections found' : 'No collections yet!'}
					description={
						matchCollectionSchema
							? `You can create ${matchCollectionSchema.label.plural} with the buttons above.`
							: 'You can start creating collections with the buttons above.'
					}
				/>
			</div>
		);
	}

	render() {
		return (
			<div className="dashboard-content_collections-component">
				<h1 className="content-title">Collections</h1>
				{this.renderTopControlGroup()}
				{this.renderCollections()}
			</div>
		);
	}
}

Collections.propTypes = propTypes;
export default Collections;
