import React from 'react';
import classNames from 'classnames';
import { Button } from 'reakit';

import { Icon } from 'components';

require('./collectionsBarButton.scss');

type Props = {
	children: React.ReactNode;
	className?: string;
	href?: string;
	icon?: null | string;
	onClick?: () => unknown;
	rightIcon?: null | string;
	[k: string]: any;
};

const CollectionsBarButton = React.forwardRef((props: Props, ref) => {
	const {
		children,
		className = '',
		href = null,
		icon = null,
		onClick = null,
		rightIcon = null,
		...restProps
	} = props;
	return (
		<Button
			{...(restProps as any)}
			onClick={onClick}
			href={href}
			className={classNames('collections-bar-button-component', className)}
			ref={ref}
			tabIndex="0"
		>
			{icon && (
				<Icon
					icon={icon}
					iconSize={14}
					className={classNames(!!children && 'spaced-icon-left')}
				/>
			)}
			{children}
			{rightIcon && <Icon icon={rightIcon} iconSize={14} className="spaced-icon-right" />}
		</Button>
	);
});

export default CollectionsBarButton;
