import React from 'react';
import PropTypes from 'prop-types';
import { Position } from '@blueprintjs/core';
import { MultiSelect } from '@blueprintjs/select';
import fuzzysearch from 'fuzzysearch';

require('./tagMultiSelect.scss');

const propTypes = {
	allTags: PropTypes.array.isRequired,
	selectedTagIds: PropTypes.array.isRequired,
	onItemSelect: PropTypes.func.isRequired,
	onRemove: PropTypes.func.isRequired,
	placeholder: PropTypes.string,
};

const defaultProps = {
	placeholder: '',
};

const TagMultiSelect = function(props) {
	const tagsById = {};
	props.allTags.forEach((tag)=> {
		tagsById[tag.id] = tag;
	});

	return (
		<MultiSelect
			items={Object.keys(tagsById)}
			itemPredicate={(query, item)=> {
				const existingTagIds = props.selectedTagIds || [];
				if (existingTagIds.indexOf(item) > -1) { return false; }

				if (!query) { return true; }
				const tag = tagsById[item];
				return fuzzysearch(query.toLowerCase(), tag.title.toLowerCase());
			}}
			itemRenderer={(item, { handleClick, modifiers })=> {
				const tag = tagsById[item];
				return (
					<li key={item}>
						<button
							type="button"
							tabIndex={-1}
							onClick={handleClick}
							className={modifiers.active ? 'pt-menu-item pt-active' : 'pt-menu-item'}
						>
							{tag.title}
						</button>
					</li>
				);
			}}
			selectedItems={props.selectedTagIds}
			tagRenderer={(item)=> {
				const tag = tagsById[item];
				return tag && tag.title;
			}}
			tagInputProps={{
				onRemove: props.onRemove,
				placeholder: props.placeholder,
				tagProps: {
					className: 'pt-minimal pt-intent-primary'
				},
				inputProps: {
					placeholder: props.placeholder,
				},
			}}
			resetOnSelect={true}
			onItemSelect={props.onItemSelect}
			noResults={<div className="pt-menu-item">No Matching Tags</div>}
			popoverProps={{
				popoverClassName: 'pt-minimal',
				position: Position.BOTTOM_LEFT,
				modifiers: {
					preventOverflow: { enabled: false },
					hide: { enabled: false },
				},
			}}
		/>
	);
};

TagMultiSelect.propTypes = propTypes;
TagMultiSelect.defaultProps = defaultProps;
export default TagMultiSelect;
