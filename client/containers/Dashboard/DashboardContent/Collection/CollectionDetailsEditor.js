/**
 * Dashboard collection tab pane that holds some miscellaneous options for collections
 */
import React from 'react';
import PropTypes from 'prop-types';
import { Checkbox, FormGroup, Button, MenuItem } from '@blueprintjs/core';

import collectionType from 'types/collection';
import communityType from 'types/community';
import { getSchemaForKind } from 'shared/collections/schemas';
import { ConfirmDialog, InputField } from 'components';
import { Select } from '@blueprintjs/select';
import LinkedPageSelect from '../Collections/LinkedPageSelect';

const propTypes = {
	collection: collectionType.isRequired,
	communityData: communityType.isRequired,
	onDeleteCollection: PropTypes.func.isRequired,
	onUpdateCollection: PropTypes.func.isRequired,
};

const readNextLabels = {
	none: 'Never show "Read Next"',
	minimal: 'Use compact preview with no image',
	medium: 'Use a larger preview with an image',
	'choose-best': 'Choose the best preview for each Pub',
};

const CollectionDetailsEditor = (props) => {
	const { collection, communityData, onUpdateCollection, onDeleteCollection } = props;
	const collectionLabel = getSchemaForKind(collection.kind).label.singular;
	return (
		<div>
			<InputField
				label="Title"
				placeholder="title"
				isRequired={true}
				onChange={(evt) => {
					onUpdateCollection({ title: evt.target.value }, false);
				}}
				value={props.collection.title}
				onBlur={() => {
					onUpdateCollection({ title: collection.title }, true);
				}}
			/>
			<FormGroup
				helperText={
					`You can link this ${collectionLabel} to a Page, and it` +
					` will serve as the landing page for the ${collectionLabel}.`
				}
			>
				<LinkedPageSelect
					onSelectPage={(pageId) => onUpdateCollection({ pageId: pageId }, true)}
					collection={collection}
					communityData={communityData}
					minimal={false}
				/>
			</FormGroup>
			<FormGroup
				helperText={
					`Making this ${collectionLabel} private means that team members will see it` +
					" but visitors won't know it exists."
				}
			>
				<Checkbox
					checked={!collection.isPublic}
					onChange={(evt) => {
						onUpdateCollection({ isPublic: !evt.target.checked }, true);
					}}
				>
					Private
				</Checkbox>
			</FormGroup>
			<FormGroup
				helperText={`You can choose how the "Read Next" Pub preview will appear to readers in this collection.`}
			>
				<Select
					popoverProps={{ minimal: true }}
					items={['none', 'minimal', 'medium', 'choose-best']}
					itemRenderer={(item, { handleClick }) => {
						const isSelected = item === collection.readNextPreviewSize;
						return (
							<MenuItem
								onClick={handleClick}
								key={item}
								text={readNextLabels[item]}
								icon={isSelected ? 'tick' : 'blank'}
							/>
						);
					}}
					onItemSelect={(size) => onUpdateCollection({ readNextPreviewSize: size }, true)}
					filterable={false}
				>
					<Button rightIcon="chevron-down">
						{readNextLabels[collection.readNextPreviewSize]}
					</Button>
				</Select>
			</FormGroup>
			<FormGroup helperText={`You can delete this ${collectionLabel} permanently.`}>
				<ConfirmDialog
					onConfirm={onDeleteCollection}
					confirmLabel="Delete"
					text={`Are you sure you want to delete this ${collectionLabel}?`}
				>
					{({ open }) => (
						<Button icon="trash" intent="danger" onClick={open}>
							Delete
						</Button>
					)}
				</ConfirmDialog>
			</FormGroup>
		</div>
	);
};

CollectionDetailsEditor.propTypes = propTypes;
export default CollectionDetailsEditor;
