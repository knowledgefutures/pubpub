import React from 'react';

require('./overviewFrame.scss');

type Props = {
	primary: React.ReactNode;
	secondary: React.ReactNode;
};

const OverviewFrame = (props: Props) => {
	const { primary, secondary } = props;

	return (
		<div className="overview-frame-component">
			<div className="primary">{primary}</div>
			<div className="secondary">{secondary}</div>
		</div>
	);
};

export default OverviewFrame;
