import React from 'react';
import { Tooltip } from '@blueprintjs/core';

import { Icon } from 'components';

require('./labelWithInfo.scss');

type Props = {
	label: React.ReactNode;
	info: React.ReactNode;
};

const LabelWithInfo = (props: Props) => {
	const { label, info } = props;
	return (
		<span className="label-with-info-component">
			{label}
			<Tooltip content={info as any}>
				<Icon icon="info-sign" />
			</Tooltip>
		</span>
	);
};

export default LabelWithInfo;
