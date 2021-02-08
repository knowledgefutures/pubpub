/**
 * The inner bits 'n' pieces of the form that lets you edit structured collection metadata, i.e. to create
 * a collection that represents a structured collection of content like a journal issue or book.
 */
import * as React from 'react';
import {
	Button,
	FormGroup,
	InputGroup,
	NonIdealState,
	ButtonGroup,
	Divider,
	Callout,
} from '@blueprintjs/core';

import ConfirmDialog from 'components/ConfirmDialog/ConfirmDialog';
import collectionType from 'types/collection';
import { enumerateMetadataFields, normalizeMetadataToKind } from 'utils/collections/metadata';
import { getSchemaForKind } from 'utils/collections/schemas';
import { apiFetch } from 'client/utils/apiFetch';

require('./collectionMetadataEditor.scss');

type Props = {
	collection: collectionType;
	communityData: any;
	onUpdateCollection: (...args: any[]) => any;
};

const validateField = ({ type, value }) => !value || !type || type.validate(value);

type State = any;

class CollectionMetadataEditor extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
		const initialMetadata = this.normalizeMetadata(props.collection.metadata || {});
		this.state = {
			title: props.collection.title,
			metadata: initialMetadata,
			isGettingDoi: false,
			isSaving: false,
			deposited: false,
			saved: false,
		};
		this.handleInputChange = this.handleInputChange.bind(this);
		this.handleTitleChange = this.handleTitleChange.bind(this);
		this.handleSaveClick = this.handleSaveClick.bind(this);
		this.handleGetDoiClick = this.handleGetDoiClick.bind(this);
	}

	allFieldsValidate() {
		const {
			// @ts-expect-error ts-migrate(2339) FIXME: Property 'kind' does not exist on type 'collection... Remove this comment to see the full error message
			collection: { kind },
		} = this.props;
		const { metadata } = this.state;
		const fields = enumerateMetadataFields(metadata, kind);
		return fields.reduce((value, nextField) => value && validateField(nextField), true);
	}

	normalizeMetadata(metadata) {
		const { collection, communityData } = this.props;
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'kind' does not exist on type 'collection... Remove this comment to see the full error message
		return normalizeMetadataToKind(metadata, collection.kind, {
			community: communityData,
			collection,
		});
	}

	deriveInputValue(derive) {
		const { communityData: community, collection } = this.props;
		return derive({ community, collection });
	}

	handleGetDoiClick() {
		const { communityData, collection, onUpdateCollection } = this.props;
		this.setState({ isGettingDoi: true, deposited: false, saved: false });
		return apiFetch('/api/doi', {
			method: 'POST',
			body: JSON.stringify({
				target: 'collection',
				collectionId: collection.id,
				communityId: communityData.id,
			}),
		})
			.then(({ dois }) => {
				onUpdateCollection({ doi: dois.collection });
				this.setState({ isGettingDoi: false, deposited: true });
			})
			.catch(() => {
				this.setState({ isGettingDoi: false });
			});
	}

	handleSaveClick() {
		const { communityData, collection, onUpdateCollection } = this.props;
		const { metadata, title } = this.state;
		this.setState({ isSaving: true, deposited: false, saved: false });
		return apiFetch('/api/collections', {
			method: 'PUT',
			body: JSON.stringify({
				metadata,
				title,
				id: collection.id,
				communityId: communityData.id,
			}),
		})
			.then(() => {
				onUpdateCollection({ metadata, title });
				this.setState({ isSaving: false, saved: true });
			})
			.catch(() => {
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

		// @ts-expect-error ts-migrate(2339) FIXME: Property 'doi' does not exist on type 'collection'... Remove this comment to see the full error message
		return collection.doi ? (
			<Button
				icon="link"
				loading={isGettingDoi}
				disabled={isGettingDoi}
				onClick={this.handleGetDoiClick}
			>
				Re-deposit
			</Button>
		) : (
			<ConfirmDialog
				onConfirm={this.handleGetDoiClick}
				confirmLabel="Assign DOI"
				intent="primary"
				text="This is the first time this collection has been deposited to Crossref. Once assigned, the DOI for this collection cannot be changed."
			>
				{({ open }) => (
					<Button
						icon="link"
						loading={isGettingDoi}
						disabled={isGettingDoi}
						onClick={open}
					>
						Deposit
					</Button>
				)}
			</ConfirmDialog>
		);
	}

	renderFieldRightElement(field) {
		const { name, defaultDerivedFrom, value } = field;
		const derivedHintValue = defaultDerivedFrom && this.deriveInputValue(defaultDerivedFrom);
		return (
			derivedHintValue && (
				<Button
					minimal
					icon="lightbulb"
					disabled={value === derivedHintValue}
					// @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 2.
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
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'kind' does not exist on type 'collection... Remove this comment to see the full error message
		const { kind } = collection;
		const fields = enumerateMetadataFields(metadata, kind);
		if (fields.length === 0) {
			return (
				<NonIdealState
					className="fields-empty-state"
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'false | E... Remove this comment to see the full error message
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

	renderStatusMessage() {
		if (this.state.deposited) {
			return (
				<Callout intent="success" title="Success!">
					<p>Successfully submitted a DOI registration for this Collection.</p>
					<p>
						Registration may take a few hours to complete in Crossref&apos;s system. If
						DOI URLs do not work immediately, the registration is likely still
						processing.
					</p>
				</Callout>
			);
		}

		if (this.state.saved) {
			return (
				<Callout intent="success" title="Success!">
					<p>Successfully saved Collection metadata.</p>
				</Callout>
			);
		}

		return null;
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
					<Divider />
					{this.renderGetDoiButton()}
				</ButtonGroup>
				{this.renderStatusMessage()}
			</div>
		);
	}
}
export default CollectionMetadataEditor;
