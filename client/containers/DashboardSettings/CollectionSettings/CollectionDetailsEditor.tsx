/**
 * Dashboard collection tab pane that holds some miscellaneous options for collections
 */
import React, { useState } from 'react';
import { Checkbox, FormGroup, Button, MenuItem } from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';

import { getSchemaForKind } from 'utils/collections/schemas';
import { Collection, Community, SlugStatus } from 'types';
import { slugifyString } from 'utils/strings';
import { ConfirmDialog, InputField } from 'components';
import { collectionUrl } from 'utils/canonicalUrls';
import { getSlugError } from 'client/utils/slug';

type Props = {
	collection: Collection;
	communityData: Community;
	onDeleteCollection: () => unknown;
	onUpdateCollection: (update: Partial<Collection>) => unknown;
	slugStatus: SlugStatus;
};

const readNextLabels = {
	none: 'Never show "Read Next"',
	minimal: 'Use compact preview with no image',
	medium: 'Use a larger preview with an image',
	'choose-best': 'Choose the best preview for each Pub',
};

const CollectionDetailsEditor = (props: Props) => {
	const { communityData, collection, onUpdateCollection, onDeleteCollection, slugStatus } = props;
	const [slug, setSlug] = useState(collection.slug);
	const collectionLabel = getSchemaForKind(collection.kind)?.label.singular;
	const slugError = getSlugError(slug, slugStatus);

	return (
		<div>
			<InputField
				label="Title"
				placeholder="title"
				isRequired={true}
				defaultValue={props.collection.title}
				onChange={(evt) => {
					if (evt.target.value) {
						onUpdateCollection({ title: evt.target.value });
					}
				}}
			/>
			<InputField
				label="Link"
				placeholder="link"
				isRequired={true}
				defaultValue={slug}
				value={slug}
				error={slugError}
				helperText={`Collection URL will be ${collectionUrl(communityData, {
					...collection,
					slug,
				})}`}
				onChange={(evt) => {
					const { value } = evt.target;
					const nextSlug = value ? slugifyString(value) : '';
					setSlug(nextSlug);
					if (nextSlug) {
						onUpdateCollection({ slug: nextSlug });
					}
				}}
			/>
			<FormGroup
				helperText={
					`Making this ${collectionLabel} private means that Members will see it` +
					" but visitors won't know it exists."
				}
			>
				<Checkbox
					checked={!collection.isPublic}
					onChange={(evt) => {
						onUpdateCollection({ isPublic: !(evt.target as any).checked });
					}}
				>
					Private
				</Checkbox>
			</FormGroup>
			<FormGroup
				helperText={`You can choose how the "Read Next" Pub preview will appear to readers in this collection.`}
			>
				<Select<Collection['readNextPreviewSize']>
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
					onItemSelect={(size) => onUpdateCollection({ readNextPreviewSize: size })}
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
