import React from 'react';
import PropTypes from 'prop-types';
import { InputGroup } from '@blueprintjs/core';

import { DashboardFrame } from 'components';

const propTypes = {
	controls: PropTypes.node.isRequired,
	children: PropTypes.node.isRequired,
	details: PropTypes.node,
	contentLabel: PropTypes.string.isRequired,
	filterAndSort: PropTypes.shape({
		setFilterText: PropTypes.func,
		filterText: PropTypes.string,
	}).isRequired,
};

const defaultProps = {
	details: null,
};

const ContentOverviewFrame = (props) => {
	const { contentLabel, controls, children, details, filterAndSort } = props;
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
		<DashboardFrame
			className="content-overview-component"
			title="Overview"
			details={details}
			controls={controls}
		>
			<div className="filter-bar">
				<div className="left">{contentLabel}</div>
				<div className="right">{renderFilterAndSortControls()}</div>
			</div>
			<div className="content">{children}</div>
		</DashboardFrame>
	);
};

ContentOverviewFrame.propTypes = propTypes;
ContentOverviewFrame.defaultProps = defaultProps;
export default ContentOverviewFrame;
