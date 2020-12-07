import React from 'react';
import classNames from 'classnames';
import { Button } from 'reakit';

import { Icon } from 'components';

require('./smallHeaderButton.scss');

type Props = {
	className?: string;
	disabled?: boolean;
	href?: null | string;
	icon: React.ReactNode;
	label?: null | string;
	labelPosition?: 'left' | 'right';
	onClick?: () => unknown;
	tagName?: string;
};

const SmallHeaderButton = React.forwardRef((props: Props, ref) => {
	const {
		className = '',
		disabled = false,
		href = null,
		icon,
		label = null,
		labelPosition = 'left',
		onClick = null,
		tagName = 'button',
	} = props;
	return (
		<Button
			as={tagName as any}
			href={href}
			ref={ref}
			onClick={onClick}
			className={classNames(
				'small-header-button-component',
				'pub-header-themed-box-hover-target',
				labelPosition === 'left' ? 'label-left' : 'label-right',
				disabled && 'disabled',
				className,
			)}
		>
			<div className="pub-header-themed-box icon-container">
				<Icon icon={icon as any} iconSize={14} />
			</div>
			{label && <div className="label">{label}</div>}
		</Button>
	);
});
export default SmallHeaderButton;
