import React from 'react';
import { Card, Checkbox } from '@blueprintjs/core';

import { LayoutBlockCollectionHeader } from 'utils/layout';
import { Collection } from 'types';
import { getOrderedCollectionMetadataFields } from 'utils/collections/getMetadata';

type Content = LayoutBlockCollectionHeader['content'];

type Props = {
	content: Content;
	onChange: (nextContent: Partial<Content>) => unknown;
	collection: Collection;
};

const MetadataCheckboxes = (props: Props) => {
	const { content, onChange, collection } = props;
	const { metadata, kind } = collection;
	if (!metadata || kind === 'tag') {
		return null;
	}
	const fields = getOrderedCollectionMetadataFields(collection).filter((x) => x.name !== 'url');

	const { hiddenMetadataFields = [] } = content;

	const handleToggleMetadataField = (fieldName: string) => {
		const nextFields = hiddenMetadataFields.includes(fieldName)
			? hiddenMetadataFields.filter((f) => f !== fieldName)
			: [...hiddenMetadataFields, fieldName];
		onChange({ hiddenMetadataFields: nextFields });
	};

	return (
		<>
			{fields.map((field) => {
				const isFieldSet = !!metadata[field.name];
				const hideField = hiddenMetadataFields.includes(field.name);
				return (
					<>
						<Checkbox
							disabled={!isFieldSet}
							checked={isFieldSet ? !hideField : false}
							onChange={() => handleToggleMetadataField(field.name)}
							label={field.label}
						/>
					</>
				);
			})}
		</>
	);
};

const Metadata = (props: Props) => {
	const { content, onChange, collection } = props;
	if (collection.kind === undefined || collection.kind === 'tag') {
		return null;
	}

	return (
		<Card>
			<MetadataCheckboxes content={content} onChange={onChange} collection={collection} />
		</Card>
	);
};

export default Metadata;
