import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Select } from '@blueprintjs/select';

import { Button, MenuItem } from '@blueprintjs/core';
import collectionSchemas from 'shared/collections/schemas';

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

const propTypes = {
	selectedSchema: PropTypes.oneOf(collectionSchemas).isRequired,
	onSelect: PropTypes.func.isRequired,
	large: PropTypes.bool,
};

const defaultProps = {
	large: false,
};

const renderCollectionKindItem = (schema, { handleClick, modifiers: { active } }) => (
	<MenuItem
		active={active}
		onClick={handleClick}
		icon={schema.bpDisplayIcon}
		text={capitalize(schema.label.singular)}
		key={schema.kind}
	/>
);

const CollectionKindDropdown = ({ large, onSelect, selectedSchema }) => {
	const [activeItem, setActiveItem] = useState(selectedSchema);
	return (
		<Select
			items={collectionSchemas}
			itemRenderer={renderCollectionKindItem}
			onItemSelect={onSelect}
			filterable={false}
			activeItem={activeItem}
			onActiveItemChange={(item) => setActiveItem(item)}
		>
			<Button
				icon={selectedSchema.bpDisplayIcon}
				text={capitalize(selectedSchema.label.singular)}
				rightIcon="caret-down"
				large={large}
			/>
		</Select>
	);
};

CollectionKindDropdown.propTypes = propTypes;
CollectionKindDropdown.defaultProps = defaultProps;

export default CollectionKindDropdown;
