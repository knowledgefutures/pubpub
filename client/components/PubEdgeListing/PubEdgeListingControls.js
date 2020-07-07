import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { Button, ButtonGroup, Checkbox, Popover, Radio } from '@blueprintjs/core';

import { toTitleCase, joinOxford } from 'utils/strings';

import { Mode, allFilters, filterToPlural } from './constants';

require('./pubEdgeListingControls.scss');

const propTypes = {
	accentColor: PropTypes.string.isRequired,
	filters: PropTypes.arrayOf(PropTypes.string).isRequired,
	mode: PropTypes.string.isRequired,
	showFilterMenu: PropTypes.bool,
	onNextClick: PropTypes.func.isRequired,
	onBackClick: PropTypes.func.isRequired,
	onModeChange: PropTypes.func.isRequired,
	onFilterToggle: PropTypes.func.isRequired,
	onAllFilterToggle: PropTypes.func.isRequired,
};

const defaultProps = {
	showFilterMenu: false,
};

const PubEdgeListingControls = (props) => {
	const {
		accentColor,
		filters,
		mode,
		showFilterMenu,
		onNextClick,
		onBackClick,
		onModeChange,
		onFilterToggle,
		onAllFilterToggle,
	} = props;
	const setCarousel = useCallback(() => onModeChange(Mode.Carousel), [onModeChange]);
	const setList = useCallback(() => onModeChange(Mode.List), [onModeChange]);
	const filterMenuItems = allFilters
		.map((filter) => {
			const checked = filters.indexOf(filter) > -1;

			return (
				<Checkbox key={filter} checked={checked} onChange={() => onFilterToggle(filter)}>
					{toTitleCase(filter)} items of this pub
				</Checkbox>
			);
		})
		.concat(
			<Checkbox
				key="all"
				onChange={onAllFilterToggle}
				checked={filters.length === allFilters.length}
			>
				All related items
			</Checkbox>,
		);

	const menu = (
		<div
			className="pub-edge-listing-controls-component-menu"
			style={{ border: `1px solid ${accentColor}` }}
		>
			<h6>Include:</h6>
			{filterMenuItems}
			<h6>Show as:</h6>
			<Radio checked={mode === Mode.Carousel} onChange={setCarousel}>
				Carousel
			</Radio>
			<Radio checked={mode === Mode.List} onChange={setList}>
				List
			</Radio>
		</div>
	);

	return (
		<nav className="pub-edge-listing-controls-component">
			<span className="filters">
				{filters.length > 0 && joinOxford(filters.map(filterToPlural))}
			</span>
			<ButtonGroup minimal>
				{mode === Mode.Carousel && (
					<>
						<Button icon="circle-arrow-left" onClick={onBackClick} minimal small />
						<Button icon="circle-arrow-right" onClick={onNextClick} minimal small />
					</>
				)}

				{showFilterMenu && (
					<Popover content={menu} minimal>
						<Button icon="filter" minimal small />
					</Popover>
				)}
			</ButtonGroup>
		</nav>
	);
};

PubEdgeListingControls.propTypes = propTypes;
PubEdgeListingControls.defaultProps = defaultProps;
export default PubEdgeListingControls;
