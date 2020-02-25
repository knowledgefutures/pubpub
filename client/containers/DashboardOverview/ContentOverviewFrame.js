import React from 'react';
import PropTypes from 'prop-types';
import { Button, InputGroup } from '@blueprintjs/core';

const propTypes = {
	buttons: PropTypes.node,
	children: PropTypes.node.isRequired,
	contentLabel: PropTypes.string.isRequired,
	filterAndSort: PropTypes.shape({
		setFilterText: PropTypes.func,
		filterText: PropTypes.string,
	}).isRequired,
};

const defaultProps = {
	buttons: null,
};

const ContentOverviewFrame = (props) => {
	const { contentLabel, buttons, children, filterAndSort } = props;
	const { setFilterText, filterText } = filterAndSort;

	const renderFilterAndSortControls = () => {
		return (
			<InputGroup
				fill
				placeholder={`Filter ${contentLabel}`}
				value={filterText}
				onChange={(evt) => {
					setFilterText(evt.target.value);
				}}
			/>
		);
	};

	return (
		<div className="content-overview-component">
			<div className="dashboard-content-header">
				<div className="name">Overview</div>
				<div className="buttons">
					{buttons}
					<Button text="New Pub" />
				</div>
			</div>
			<div className="filter-bar">
				<div className="left">{contentLabel}</div>
				<div className="right">{renderFilterAndSortControls()}</div>
			</div>
			<div className="content">{children}</div>
		</div>
	);
};

ContentOverviewFrame.propTypes = propTypes;
ContentOverviewFrame.defaultProps = defaultProps;
export default ContentOverviewFrame;
