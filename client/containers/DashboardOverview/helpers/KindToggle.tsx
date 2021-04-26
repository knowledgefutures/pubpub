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
	disabled?: boolean;
};

const KindToggle = (props: Props) => {
	const { selected, onSelect, label, count, icon, disabled } = props;
	return (
		<Checkbox
			as="div"
			className="kind-toggle-component"
			checked={selected}
			onChange={() => onSelect(!selected)}
			unstable_clickOnEnter
			disabled={disabled}
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
