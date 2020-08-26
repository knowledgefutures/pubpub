import React from 'react';
import classNames from 'classnames';

require('./dashboardRowListing.scss');

type OwnProps = {
	children: React.ReactNode;
	className?: string;
};

const defaultProps = {
	className: '',
};

type Props = OwnProps & typeof defaultProps;

const DashboardRowListing = (props: Props) => {
	const { children, className } = props;
	return (
		<ul className={classNames('dashboard-row-listing-component', className)}>
			{React.Children.map(children, (child) => (
				<li>{child}</li>
			))}
		</ul>
	);
};
DashboardRowListing.defaultProps = defaultProps;
export default DashboardRowListing;
