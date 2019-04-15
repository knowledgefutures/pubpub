import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Select } from '@blueprintjs/select';
import { Button, MenuItem } from '@blueprintjs/core';

import collectionSchemas from 'shared/collections/schemas';

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

const propTypes = {
	selectedSchema: PropTypes.oneOf(collectionSchemas),
	onSelect: PropTypes.func.isRequired,
};

const defaultProps = {
	selectedSchema: null,
};

const iconAndTextForSchema = (schema) => ({
	text: schema ? capitalize(schema.label.plural) : 'All collections',
	icon: schema && schema.bpDisplayIcon,
});

// eslint-disable-next-line react/prop-types
const renderCollectionKindItem = (schema, { handleClick, modifiers: { active } }) => (
	<MenuItem
		{...iconAndTextForSchema(schema)}
		active={active}
		onClick={handleClick}
		key={schema ? schema.kind : 'none'}
	/>
);

const CollectionKindDropdown = ({ onSelect, selectedSchema }) => {
	const [activeItem, setActiveItem] = useState(selectedSchema);
	return (
		<Select
			items={[null].concat(collectionSchemas)}
			itemRenderer={renderCollectionKindItem}
			onItemSelect={onSelect}
			filterable={false}
			activeItem={activeItem}
			onActiveItemChange={(item) => setActiveItem(item)}
		>
			<Button {...iconAndTextForSchema(selectedSchema)} rightIcon="caret-down" />
		</Select>
	);
};

CollectionKindDropdown.propTypes = propTypes;
CollectionKindDropdown.defaultProps = defaultProps;

export default CollectionKindDropdown;
