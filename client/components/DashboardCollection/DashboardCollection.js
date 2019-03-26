/**
 * Renders the dashboard options for a single collection
 */
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { NonIdealState, Tabs, Tab, Spinner } from '@blueprintjs/core';

import { apiFetch } from 'utilities';
import collectionType from 'types/collection';
import communityType from 'types/community';
import pubType from 'types/pub';

import CollectionEditor from '../CollectionEditor/CollectionEditor';
import AttributionEditor from '../AttributionEditor/AttributionEditor';
import CollectionMetadataEditor from '../CollectionMetadata/CollectionMetadataEditor';
import CollectionDetailsEditor from './CollectionDetailsEditor';

require('./dashboardCollection.scss');

const LINK_TO_COLLECTIONS = '/dashboard/collections';

const propTypes = {
	communityData: communityType.isRequired,
	initialCollection: collectionType.isRequired,
	pubsData: PropTypes.arrayOf(pubType).isRequired,
};

class DashboardCollection extends React.Component {
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
		const pageUpdate = updatedCollection.pageId
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
		const { collection } = this.state;
		apiFetch('/api/collections', {
			method: 'DELETE',
			body: JSON.stringify({
				id: collection.id,
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
		return (
			<Tabs
				id="collection"
				onChange={this.handleTabChange}
				selectedTab="contents"
				className="tab-container"
			>
				<Tab id="contents" title="Contents" panel={this.renderContentsEditor()} />
				<Tab id="attribution" title="Attribution" panel={this.renderAttributionEditor()} />
				<Tab id="metadata" title="Metadata" panel={this.renderMetadataEditor()} />
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
				<div className="component-dashboard-collection">
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

DashboardCollection.propTypes = propTypes;
export default DashboardCollection;
