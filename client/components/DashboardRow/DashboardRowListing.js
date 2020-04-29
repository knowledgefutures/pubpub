import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

require('./dashboardRowListing.scss');

const propTypes = {
	children: PropTypes.node.isRequired,
	className: PropTypes.string,
};

const defaultProps = {
	className: '',
};

const DashboardRowListing = (props) => {
	const { children, className } = props;
	return (
		<ul className={classNames('dashboard-row-listing-component', className)}>
			{React.Children.map(children, (child) => (
				<li>{child}</li>
			))}
		</ul>
	);
};

DashboardRowListing.propTypes = propTypes;
DashboardRowListing.defaultProps = defaultProps;
export default DashboardRowListing;
