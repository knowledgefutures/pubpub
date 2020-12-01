import React from 'react';
import classNames from 'classnames';
import { Button } from 'reakit';

type Props = {
	color: string;
	label: React.ReactNode;
	onClick?: (...args: any[]) => any;
	selected?: boolean;
};

const defaultProps = {
	onClick: null,
	selected: false,
};

const TintStyleChoice = React.forwardRef<any, Props>(({ label, onClick, color, selected }, ref) => {
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
// @ts-expect-error ts-migrate(2322) FIXME: Type '{ onClick: null; selected: boolean; }' is no... Remove this comment to see the full error message
TintStyleChoice.defaultProps = defaultProps;
export default TintStyleChoice;
