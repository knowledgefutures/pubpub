import React from 'react';

import { MobileAware } from 'components';

import './overviewFrame.scss';

type Props = {
	primary: React.ReactNode;
	secondary?: React.ReactNode;
};

const OverviewFrame = (props: Props) => {
	const { primary, secondary } = props;

	return (
		<div className="overview-frame-component">
			<div className="primary">{primary}</div>
			{secondary && <MobileAware desktop={<div className="secondary">{secondary}</div>} />}
		</div>
	);
};

export default OverviewFrame;
