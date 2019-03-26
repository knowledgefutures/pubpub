import * as React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';
import fuzzysearch from 'fuzzysearch';

import collectionType from 'types/collection';
import communityType from 'types/community';

const propTypes = {
	collection: collectionType.isRequired,
	communityData: communityType.isRequired,
	onSelectPage: PropTypes.func.isRequired,
	minimal: PropTypes.bool,
};

const defaultProps = {
	minimal: false,
};

const LinkedPageSelect = ({ communityData, collection, onSelectPage, minimal }) => (
	<Select
		items={communityData.pages}
		itemRenderer={(page, { handleClick, modifiers }) => {
			return (
				<button
					key={page.title}
					type="button"
					tabIndex={-1}
					onClick={handleClick}
					className={modifiers.active ? 'bp3-menu-item bp3-active' : 'bp3-menu-item'}
				>
					{page.title}
				</button>
			);
		}}
		itemListPredicate={(query, pages) => {
			return pages.filter((page) => {
				return fuzzysearch(query.toLowerCase(), page.title.toLowerCase());
			});
		}}
		onItemSelect={(page) => onSelectPage(page.id)}
		popoverProps={{ popoverClassName: 'bp3-minimal' }}
	>
		<Button
			minimal={minimal}
			text={collection.page ? `Linked to: ${collection.page.title}` : 'Link to Page'}
			rightIcon="caret-down"
		/>
	</Select>
);

LinkedPageSelect.propTypes = propTypes;
LinkedPageSelect.defaultProps = defaultProps;
export default LinkedPageSelect;
