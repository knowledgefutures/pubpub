/**
 * Renders the dashboard options for a single collection
 */
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { NonIdealState, Tabs, Tab, Spinner } from '@blueprintjs/core';

import { apiFetch } from 'utils';
import collectionType from 'types/collection';
import communityType from 'types/community';
import { pubDataProps } from 'types/pub';
import { AttributionEditor } from 'components';
import CollectionEditor from './CollectionEditor';
import CollectionDetailsEditor from './CollectionDetailsEditor';
import CollectionMetadataEditor from './CollectionMetadataEditor';

require('./collection.scss');

const LINK_TO_COLLECTIONS = '/dashboard/collections';

const propTypes = {
	communityData: communityType.isRequired,
	initialCollection: collectionType.isRequired,
	pubsData: PropTypes.arrayOf(pubDataProps).isRequired,
};

class Collection extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			collection: props.initialCollection,
			persistingCount: 0,
		};
		this.handlePersistStateChange = this.handlePersistStateChange.bind(this);
		this.handleUpdateCollection = this.handleUpdateCollection.bind(this);
		this.handleDeleteCollection = this.handleDeleteCollection.bind(this);
	}

	handlePersistStateChange(delta) {
		this.setState((state) => ({ persistingCount: state.persistingCount + delta }));
	}

	handleUpdateCollection(updatedCollection, persistNow) {
		const { communityData } = this.props;
		const { collection } = this.state;
		if (persistNow) {
			this.handlePersistStateChange(1);
			apiFetch('/api/collections', {
				method: 'PUT',
				body: JSON.stringify({
					...updatedCollection,
					id: collection.id,
					communityId: this.props.communityData.id,
				}),
			}).then(() => this.handlePersistStateChange(-1));
		}
		const pageUpdate = Object.keys(updatedCollection).includes('pageId')
			? { page: communityData.pages.find((page) => page.id === updatedCollection.pageId) }
			: {};
		this.setState({
			collection: {
				...collection,
				...updatedCollection,
				...pageUpdate,
			},
		});
	}

	handleDeleteCollection() {
		const { communityData } = this.props;
		const { collection } = this.state;
		apiFetch('/api/collections', {
			method: 'DELETE',
			body: JSON.stringify({
				id: collection.id,
				communityId: communityData.id,
			}),
		}).then(() => {
			window.location = '/dashboard/collections';
		});
	}

	renderContentsEditor() {
		const { communityData, pubsData } = this.props;
		const { collection } = this.state;
		return (
			<CollectionEditor
				collection={collection}
				pubs={pubsData}
				communityId={communityData.id}
				onPersistStateChange={this.handlePersistStateChange}
			/>
		);
	}

	renderAttributionEditor() {
		const { communityData } = this.props;
		const { collection } = this.state;
		return (
			<AttributionEditor
				apiRoute="/api/collectionAttributions"
				canEdit={true}
				attributions={collection.attributions}
				listOnBylineText="List on Pub byline"
				identifyingProps={{ collectionId: collection.id, communityId: communityData.id }}
				onPersistStateChange={this.handlePersistStateChange}
				onUpdateAttributions={(attributions) =>
					this.setState((state) => ({
						collection: {
							...state.collection,
							attributions: attributions,
						},
					}))
				}
			/>
		);
	}

	renderMetadataEditor() {
		const { communityData } = this.props;
		const { collection } = this.state;
		return (
			<CollectionMetadataEditor
				collection={collection}
				communityData={communityData}
				onPersistStateChange={this.handlePersistStateChange}
				onUpdateCollection={this.handleUpdateCollection}
			/>
		);
	}

	renderEmptyState() {
		return (
			<NonIdealState
				icon="help"
				title="No collection found here"
				description={<a href={LINK_TO_COLLECTIONS}>Return to all collections</a>}
			/>
		);
	}

	renderDetailsEditor() {
		const { communityData } = this.props;
		const { collection } = this.state;
		return (
			<CollectionDetailsEditor
				communityData={communityData}
				collection={collection}
				onUpdateCollection={this.handleUpdateCollection}
				onDeleteCollection={this.handleDeleteCollection}
			/>
		);
	}

	renderTabs() {
		const isTag = this.state.collection.kind === 'tag';
		return (
			<Tabs
				id="collection"
				onChange={this.handleTabChange}
				selectedTab="contents"
				className="tab-container"
			>
				<Tab id="contents" title="Contents" panel={this.renderContentsEditor()} />
				{!isTag && (
					<Tab
						id="attribution"
						title="Attribution"
						panel={this.renderAttributionEditor()}
					/>
				)}
				{!isTag && (
					<Tab id="metadata" title="Metadata" panel={this.renderMetadataEditor()} />
				)}
				<Tab id="details" title="Details" panel={this.renderDetailsEditor()} />
			</Tabs>
		);
	}

	render() {
		const { communityData } = this.props;
		const { collection, persistingCount } = this.state;
		const isPersisting = persistingCount > 0;
		if (collection) {
			return (
				<div className="dashboard-content_collection-component">
					<h1>
						<a style={{ color: communityData.accentColor }} href={LINK_TO_COLLECTIONS}>
							Collections
						</a>{' '}
						&rsaquo; {collection.title}{' '}
						<Spinner
							size={25}
							className={classNames('save-spinner', isPersisting && 'visible')}
						/>
					</h1>
					{this.renderTabs()}
				</div>
			);
		}
		return this.renderEmptyState();
	}
}

Collection.propTypes = propTypes;
export default Collection;
