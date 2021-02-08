import React from 'react';
import classNames from 'classnames';
import { Button } from 'reakit';

type Props = {
	color: string;
	label: React.ReactNode;
	onClick?: (...args: any[]) => any;
	selected?: boolean;
};

const TintStyleChoice = React.forwardRef((props: Props, ref) => {
	const { label, onClick, color, selected } = props;
	return (
		// @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
		<Button className="tint-choice" onClick={onClick} ref={ref} title={label}>
			<div className="example">
				<div className="transparency" />
				<div
					className={classNames('inner', 'selectable', selected && 'selected')}
					style={{ backgroundColor: color }}
				/>
			</div>
			<div className="label">{label}</div>
		</Button>
	);
});

export default TintStyleChoice;
