/**
 * The inner bits 'n' pieces of the form that lets you edit structured collection metadata, i.e. to create
 * a collection that represents a structured collection of content like a journal issue or book.
 */
import * as React from 'react';
import PropTypes from 'prop-types';
import { Button, FormGroup, InputGroup, NonIdealState, ButtonGroup } from '@blueprintjs/core';

import ConfirmDialog from 'components/ConfirmDialog/ConfirmDialog';
import collectionType from 'types/collection';
import { enumerateMetadataFields, normalizeMetadataToKind } from 'utils/collections/metadata';
import { getSchemaForKind } from 'utils/collections/schemas';
import { apiFetch } from 'client/utils/apiFetch';

require('./collectionMetadataEditor.scss');

const propTypes = {
	collection: collectionType.isRequired,
	communityData: PropTypes.object.isRequired,
	onUpdateCollection: PropTypes.func.isRequired,
};

const validateField = ({ type, value }) => !value || !type || type.validate(value);

class CollectionMetadataEditor extends React.Component {
	constructor(props) {
		super(props);
		const initialMetadata = this.normalizeMetadata(props.collection.metadata || {});
		this.state = {
			title: props.collection.title,
			metadata: initialMetadata,
			isGettingDoi: false,
			isSaving: false,
		};
		this.handleInputChange = this.handleInputChange.bind(this);
		this.handleTitleChange = this.handleTitleChange.bind(this);
		this.handleSaveClick = this.handleSaveClick.bind(this);
		this.handleGetDoiClick = this.handleGetDoiClick.bind(this);
	}

	allFieldsValidate() {
		const {
			collection: { kind },
		} = this.props;
		const { metadata } = this.state;
		const fields = enumerateMetadataFields(metadata, kind);
		return fields.reduce((value, nextField) => value && validateField(nextField), true);
	}

	normalizeMetadata(metadata) {
		const { collection, communityData } = this.props;
		return normalizeMetadataToKind(metadata, collection.kind, {
			community: communityData,
			collection: collection,
		});
	}

	deriveInputValue(derive) {
		const { communityData: community, collection } = this.props;
		return derive({ community: community, collection: collection });
	}

	handleGetDoiClick() {
		const { communityData, collection, onUpdateCollection } = this.props;
		this.setState({ isGettingDoi: true });
		return apiFetch('/api/doi/collection', {
			method: 'POST',
			body: JSON.stringify({
				collectionId: collection.id,
				communityId: communityData.id,
			}),
		}).then(({ dois }) => {
			onUpdateCollection({ doi: dois.collection });
			this.setState({ isSaving: false });
		});
	}

	handleSaveClick() {
		const { communityData, collection, onUpdateCollection } = this.props;
		const { metadata, title } = this.state;
		this.setState({ isSaving: true });
		return apiFetch('/api/collections', {
			method: 'PUT',
			body: JSON.stringify({
				metadata: metadata,
				title: title,
				id: collection.id,
				communityId: communityData.id,
			}),
		}).then(() => {
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

	renderGetDoiButton() {
		const { collection } = this.props;
		const { isGettingDoi } = this.state;
		return (
			!collection.doi && (
				<ConfirmDialog
					onConfirm={this.handleGetDoiClick}
					confirmLabel="Assign DOI"
					intent="primary"
					text={
						<span>Once assigned, the DOI for this collection cannot be changed.</span>
					}
				>
					{({ open }) => (
						<Button minimal icon="link" disabled={isGettingDoi} onClick={open}>
							Get DOI
						</Button>
					)}
				</ConfirmDialog>
			)
		);
	}

	renderFieldRightElement(field) {
		const { name, defaultDerivedFrom, value } = field;
		if (field.name === 'doi') {
			return this.renderGetDoiButton();
		}
		const derivedHintValue = defaultDerivedFrom && this.deriveInputValue(defaultDerivedFrom);
		return (
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
		);
	}

	renderField(field) {
		const { name, label, derivedFrom, derivedLabelInfo, pattern, type, value } = field;
		const derivedValue = derivedFrom && this.deriveInputValue(derivedFrom);
		return (
			<FormGroup
				key={name}
				label={label}
				labelInfo={derivedValue ? derivedLabelInfo : type && type.labelInfo}
			>
				<InputGroup
					className="field"
					value={derivedValue || value || ''}
					onChange={(event) => this.handleInputChange(name, event.target.value, pattern)}
					intent={validateField(field) ? 'none' : 'danger'}
					rightElement={this.renderFieldRightElement(field)}
				/>
			</FormGroup>
		);
	}

	renderFields() {
		const { collection } = this.props;
		const { metadata } = this.state;
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
				{/* <FormGroup label="Title">
					<InputGroup className="field" value={title} onChange={this.handleTitleChange} />
				</FormGroup> */}
				{fields.map((field) => this.renderField(field))}
			</div>
		);
	}

	render() {
		const { isSaving } = this.state;
		return (
			<div className="dashboard-content_collection-metadata-editor">
				{this.renderFields()}
				<ButtonGroup>
					<Button
						icon="tick"
						disabled={isSaving || !this.allFieldsValidate()}
						onClick={this.handleSaveClick}
					>
						Save changes
					</Button>
				</ButtonGroup>
			</div>
		);
	}
}

CollectionMetadataEditor.propTypes = propTypes;
export default CollectionMetadataEditor;
