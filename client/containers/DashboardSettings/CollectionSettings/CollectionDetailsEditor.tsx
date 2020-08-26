/**
 * Dashboard collection tab pane that holds some miscellaneous options for collections
 */
import React from 'react';
import { Checkbox, FormGroup, Button, MenuItem } from '@blueprintjs/core';

// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'types/collection' or its corre... Remove this comment to see the full error message
import collectionType from 'types/collection';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'types/community' or its corres... Remove this comment to see the full error message
import communityType from 'types/community';
import { getSchemaForKind } from 'utils/collections/schemas';
import { ConfirmDialog, InputField, LinkedPageSelect } from 'components';
import { Select } from '@blueprintjs/select';

type Props = {
	collection: collectionType;
	communityData: communityType;
	onDeleteCollection: (...args: any[]) => any;
	onUpdateCollection: (...args: any[]) => any;
};

const readNextLabels = {
	none: 'Never show "Read Next"',
	minimal: 'Use compact preview with no image',
	medium: 'Use a larger preview with an image',
	'choose-best': 'Choose the best preview for each Pub',
};

const CollectionDetailsEditor = (props: Props) => {
	const { collection, communityData, onUpdateCollection, onDeleteCollection } = props;
	// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
	const collectionLabel = getSchemaForKind(collection.kind).label.singular;
	return (
		<div>
			<InputField
				label="Title"
				placeholder="title"
				isRequired={true}
				defaultValue={props.collection.title}
				onBlur={(evt) => {
					if (evt.target.value) {
						onUpdateCollection({ title: evt.target.value });
					}
				}}
			/>
			<FormGroup
				helperText={
					`You can link this ${collectionLabel} to a Page, and it` +
					` will serve as the landing page for the ${collectionLabel}.`
				}
			>
				<LinkedPageSelect
					onSelectPage={(page) => onUpdateCollection({ pageId: page.id }, true)}
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
						// @ts-expect-error ts-migrate(2339) FIXME: Property 'checked' does not exist on type 'EventTa... Remove this comment to see the full error message
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
					items={['none', 'choose-best']}
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
export default CollectionDetailsEditor;
