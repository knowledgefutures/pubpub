import * as React from 'react';
import PropTypes from 'prop-types';
import { Button, MenuItem } from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';
import fuzzysearch from 'fuzzysearch';

const propTypes = {
	collection: PropTypes.shape({
		page: PropTypes.shape({
			title: PropTypes.string,
		}),
	}).isRequired,
	communityData: PropTypes.shape({
		pages: PropTypes.arrayOf(
			PropTypes.shape({
				id: PropTypes.string,
				title: PropTypes.string,
			}),
		).isRequired,
	}).isRequired,
	onSelectPage: PropTypes.func.isRequired,
	targetElement: PropTypes.node,
	minimal: PropTypes.bool,
};

const defaultProps = {
	minimal: false,
	targetElement: null,
};

const LinkedPageSelect = ({ communityData, collection, onSelectPage, minimal, targetElement }) => (
	<Select
		items={[{ title: '(None)', id: null }].concat(communityData.pages)}
		itemRenderer={(page, { handleClick }) => {
			return <MenuItem key={page.title} onClick={handleClick} text={page.title} />;
		}}
		itemListPredicate={(query, pages) => {
			return pages.filter((page) => {
				return fuzzysearch(query.toLowerCase(), page.title.toLowerCase());
			});
		}}
		onItemSelect={(page) => onSelectPage(page.id)}
		popoverProps={{ popoverClassName: 'bp3-minimal' }}
	>
		{targetElement || (
			<Button
				className="linked-page-select-button"
				minimal={minimal}
				text={collection.page ? collection.page.title : <em>Link to Page</em>}
				icon="link"
			/>
		)}
	</Select>
);

LinkedPageSelect.propTypes = propTypes;
LinkedPageSelect.defaultProps = defaultProps;
export default LinkedPageSelect;
