import React from 'react';
import { Checkbox } from 'reakit/Checkbox';

import { Icon, IconName } from 'components';

require('./kindToggle.scss');

type Props = {
	selected: boolean;
	onSelect: (v: boolean) => unknown;
	icon: IconName;
	label: React.ReactNode;
	count: number | string;
};

const KindToggle = (props: Props) => {
	const { selected, onSelect, label, count, icon } = props;
	return (
		<Checkbox
			as="div"
			className="kind-toggle-component"
			checked={selected}
			onChange={() => onSelect(!selected)}
			unstable_clickOnEnter
		>
			<Icon icon={icon} iconSize={12} />
			<span className="label">
				{label}&nbsp;
				<span className="count">({count})</span>
			</span>
		</Checkbox>
	);
};

export default KindToggle;
