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
				title: PropTypes.string,
				id: PropTypes.string,
			}),
		),
	}).isRequired,
	onSelectPage: PropTypes.func.isRequired,
	targetElement: PropTypes.node,
	minimal: PropTypes.bool,
	selfContained: PropTypes.bool,
};

const defaultProps = {
	minimal: false,
	targetElement: null,
	selfContained: false,
};

const LinkedPageSelect = (props) => {
	const {
		communityData,
		collection,
		onSelectPage,
		minimal,
		targetElement,
		selfContained,
	} = props;

	const renderButtonText = () => {
		if (collection.page) {
			if (selfContained) {
				return (
					<>
						<em>Page:</em> {collection.page.title}
					</>
				);
			}
			return collection.page.title;
		}
		if (selfContained) {
			return 'Link to Page';
		}
		return <em>Link to Page</em>;
	};

	return (
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
			onItemSelect={(page) => onSelectPage(page.id === null ? null : page)}
			popoverProps={{ popoverClassName: 'bp3-minimal' }}
		>
			{targetElement || (
				<Button
					className="linked-page-select-button"
					minimal={minimal}
					text={renderButtonText()}
					icon="link"
				/>
			)}
		</Select>
	);
};

LinkedPageSelect.propTypes = propTypes;
LinkedPageSelect.defaultProps = defaultProps;
export default LinkedPageSelect;
