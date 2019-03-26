/**
 * The inner bits 'n' pieces of the form that lets you edit structured collection metadata, i.e. to create
 * a collection that represents a structured collection of content like a journal issue or book.
 */
import * as React from 'react';
import PropTypes from 'prop-types';
import { Button, FormGroup, InputGroup, NonIdealState, ButtonGroup } from '@blueprintjs/core';

import collectionType from 'types/collection';
import { apiFetch } from 'utilities';
import { enumerateMetadataFields, normalizeMetadataToKind } from 'shared/collections/metadata';
import { getSchemaForKind } from 'shared/collections/schemas';

require('./collectionMetadataEditor.scss');

const propTypes = {
	collection: collectionType.isRequired,
	communityData: PropTypes.shape({}).isRequired,
	onPersistStateChange: PropTypes.func.isRequired,
	onUpdateCollection: PropTypes.func.isRequired,
};

class CollectionMetadataEditor extends React.Component {
	constructor(props) {
		super(props);
		const initialMetadata = this.normalizeMetadata(props.collection.metadata || {});
		this.state = {
			title: props.collection.title,
			metadata: initialMetadata,
			isSaving: false,
		};
		this.handleInputChange = this.handleInputChange.bind(this);
		this.handleTitleChange = this.handleTitleChange.bind(this);
		this.handleSaveClick = this.handleSaveClick.bind(this);
	}

	normalizeMetadata(metadata) {
		const { collection, communityData } = this.props;
		return normalizeMetadataToKind(metadata, collection.kind, {
			community: communityData,
			collection: collection,
		});
	}

	deriveInputDefault(defaultDerivedFrom) {
		const { communityData: community } = this.props;
		return defaultDerivedFrom({ community: community });
	}

	handleSaveClick() {
		const { communityData, collection, onPersistStateChange, onUpdateCollection } = this.props;
		const { metadata, title } = this.state;
		this.setState({ isSaving: true });
		onPersistStateChange(1);
		return apiFetch('/api/collections', {
			method: 'PUT',
			body: JSON.stringify({
				metadata: metadata,
				title: title,
				id: collection.id,
				communityId: communityData.id,
			}),
		}).then(() => {
			onPersistStateChange(-1);
			onUpdateCollection({ metadata: metadata, title: title });
			this.setState({ isSaving: false });
		});
	}

	handleInputChange(field, value, pattern) {
		const { metadata } = this.state;
		if (pattern && !new RegExp(pattern).test(value)) {
			return;
		}
		this.setState({
			metadata: this.normalizeMetadata({
				...metadata,
				[field]: value,
			}),
		});
	}

	handleTitleChange(e) {
		this.setState({ title: e.target.value });
	}

	renderField(field) {
		const { name, value, derived, defaultDerivedFrom, pattern } = field;
		const derivedHintValue = defaultDerivedFrom && this.deriveInputDefault(defaultDerivedFrom);
		return (
			<InputGroup
				className="field"
				value={value || ''}
				disabled={derived}
				onChange={(event) => this.handleInputChange(name, event.target.value, pattern)}
				rightElement={
					derivedHintValue && (
						<Button
							minimal
							icon="lightbulb"
							disabled={value === derivedHintValue}
							onClick={() => this.handleInputChange(name, derivedHintValue)}
						>
							Use default
						</Button>
					)
				}
			/>
		);
	}

	renderFields() {
		const { collection } = this.props;
		const { title, metadata } = this.state;
		const { kind } = collection;
		const fields = enumerateMetadataFields(metadata, kind);
		if (fields.length === 0) {
			return (
				<NonIdealState
					className="fields-empty-state"
					icon={getSchemaForKind(kind).bpDisplayIcon || 'help'}
					title="This collection type has no metadata"
				/>
			);
		}
		return (
			<div className="fields">
				<FormGroup label="Title">
					<InputGroup className="field" value={title} onChange={this.handleTitleChange} />
				</FormGroup>
				{fields.map((field) =>
					field.disabled ? null : (
						<FormGroup key={field.name} label={field.label}>
							{this.renderField(field)}
						</FormGroup>
					),
				)}
			</div>
		);
	}

	render() {
		const { isSaving } = this.state;
		return (
			<div className="component-collection-metadata-editor">
				{this.renderFields()}
				<ButtonGroup>
					<Button icon="tick" disabled={isSaving} onClick={this.handleSaveClick}>
						Save changes
					</Button>
				</ButtonGroup>
			</div>
		);
	}
}

CollectionMetadataEditor.propTypes = propTypes;

export default CollectionMetadataEditor;
