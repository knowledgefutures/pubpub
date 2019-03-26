/**
 * Dashboard collection tab pane that holds some miscellaneous options for collections
 */
import React from 'react';
import PropTypes from 'prop-types';

import collectionType from 'types/collection';
import communityType from 'types/community';

import { Checkbox, FormGroup, Button } from '@blueprintjs/core';
import LinkedPageSelect from '../DashboardCollections/LinkedPageSelect';
import { getSchemaForKind } from '../../shared/collections/schemas';
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog';

const propTypes = {
	collection: collectionType.isRequired,
	communityData: communityType.isRequired,
	onDeleteCollection: PropTypes.func.isRequired,
	onUpdateCollection: PropTypes.func.isRequired,
};

const CollectionDetailsEditor = (props) => {
	const { collection, communityData, onUpdateCollection, onDeleteCollection } = props;
	const collectionLabel = getSchemaForKind(collection.kind).label.singular;
	return (
		<div>
			<FormGroup
				helperText={
					`You can link a ${collectionLabel} to a Page, and it` +
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
					`Making a ${collectionLabel} private means that team members will see it` +
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
