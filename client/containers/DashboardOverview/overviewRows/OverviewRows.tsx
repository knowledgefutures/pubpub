import React from 'react';
import classNames from 'classnames';

require('./overviewRows.scss');

type Props = {
	children: React.ReactNodeArray;
	style?: React.CSSProperties;
	className?: string;
};

const OverviewRows = (props: Props) => {
	const { children, style, className } = props;
	return (
		<ul style={style} className={classNames('overview-rows-component', className)}>
			{React.Children.map(children, (child, index) =>
				// eslint-disable-next-line react/no-array-index-key
				child ? <li key={index}>{child}</li> : null,
			)}
		</ul>
	);
};

export default OverviewRows;
