import * as React from 'react';
import PropTypes from 'prop-types';
import { Checkbox, EditableText, ControlGroup, AnchorButton } from '@blueprintjs/core';

import collectionType from 'types/collection';
import communityType from 'types/community';
import { getSchemaForKind } from 'shared/collections/schemas';

import LinkedPageSelect from './LinkedPageSelect';
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog';

const propTypes = {
	collection: collectionType.isRequired,
	communityData: communityType.isRequired,
	onDeleteCollection: PropTypes.func.isRequired,
	onUpdateCollection: PropTypes.func.isRequired,
};

const CollectionRow = ({ communityData, collection, onUpdateCollection, onDeleteCollection }) => {
	const schema = getSchemaForKind(collection.kind);
	const label = schema.label.singular;
	const canEditMetadata = schema.metadata.length > 0;
	return (
		<div key={`collection-${collection.id}`} className="collection-wrapper">
			<div className="title">
				<EditableText
					defaultValue={collection.title}
					onConfirm={(newTitle) => {
						onUpdateCollection({
							title: newTitle,
							id: collection.id,
						});
					}}
				/>
			</div>
			<ControlGroup>
				<LinkedPageSelect
					collection={collection}
					onSelectPage={(pageId) =>
						onUpdateCollection({
							id: collection.id,
							pageId: pageId,
						})
					}
					communityData={communityData}
					minimal={true}
				/>
				{canEditMetadata && (
					<AnchorButton
						href={`/dashboard/collections/${collection.id}`}
						minimal={true}
						icon="edit"
					>
						Edit
					</AnchorButton>
				)}
			</ControlGroup>
			<Checkbox
				checked={!collection.isPublic}
				onChange={(evt) => {
					onUpdateCollection({
						isPublic: !evt.target.checked,
						id: collection.id,
					});
				}}
			>
				Private
			</Checkbox>
			<ConfirmDialog
				text={`Are you sure you want to delete this ${label}?`}
				confirmLabel="Delete"
				onConfirm={() => {
					onDeleteCollection(collection.id);
				}}
			>
				{({ open }) => (
					<button
						type="button"
						className="bp3-button bp3-icon-small-cross bp3-minimal"
						onClick={open}
					/>
				)}
			</ConfirmDialog>
		</div>
	);
};

CollectionRow.propTypes = propTypes;
export default CollectionRow;
