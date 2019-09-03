import React from 'react';
import PropTypes from 'prop-types';
import { Switch } from '@blueprintjs/core';
import LabelFilter, { propTypes as labelFilterPropTypes } from './LabelFilter';

require('./filterMenu.scss');

const propTypes = {
	...labelFilterPropTypes,
	isBrowsingArchive: PropTypes.bool.isRequired,
	isShowingAnchoredComments: PropTypes.bool.isRequired,
	onBrowseArchive: PropTypes.func.isRequired,
	onShowAnchoredComments: PropTypes.func.isRequired,
};

const FilterMenu = (props) => {
	const {
		isBrowsingArchive,
		isShowingAnchoredComments,
		onBrowseArchive,
		onShowAnchoredComments,
	} = props;
	return (
		<div className="filter-menu-component">
			<Switch
				label="Browse archived comments"
				checked={isBrowsingArchive}
				onChange={(e) => onBrowseArchive(e.target.checked)}
			/>
			<Switch
				label="Show anchored comments"
				checked={isShowingAnchoredComments}
				onChange={(e) => onShowAnchoredComments(e.target.checked)}
			/>
			<LabelFilter {...props} />
		</div>
	);
};

FilterMenu.propTypes = propTypes;
export default FilterMenu;
