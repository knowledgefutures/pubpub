import React from 'react';

type Props = {
	containerClassName?: string;
	columnClassName?: string;
	children?: React.ReactNode;
};

const GridWrapper = (props: Props) => {
	const { containerClassName = '', columnClassName = '', children = null } = props;
	return (
		<div className={`container ${containerClassName}`}>
			<div className="row">
				<div className={`col-12 ${columnClassName}`}>{children}</div>
			</div>
		</div>
	);
};

export default GridWrapper;
